"use server";

import { revalidatePath, unstable_cache } from "next/cache";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { logAuditEvent } from "@/services/audit";

// Local types since Prisma client is not fully generated
const classificationStatusSchema = z.enum(["CONFIRMED", "NEEDS_REVIEW", "PENDING", "ARCHIVED"]);
const materialTypeSchema = z.enum([
  "PLASTIC",
  "PLASTIC_PET",
  "CARDBOARD",
  "GLASS",
  "ALUMINUM",
  "STEEL",
  "WOOD",
  "TEXTILE",
  "COMPOSITE",
  "UNKNOWN",
]);
const ecoOrganismSchema = z.enum(["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"]);

export type ClassificationStatus = z.infer<typeof classificationStatusSchema>;
export type MaterialType = z.infer<typeof materialTypeSchema>;
export type EcoOrganism = z.infer<typeof ecoOrganismSchema>;

// Valid status transitions: from → allowed targets
const VALID_TRANSITIONS: Record<ClassificationStatus, ClassificationStatus[]> = {
  PENDING: ["NEEDS_REVIEW", "CONFIRMED", "ARCHIVED"],
  NEEDS_REVIEW: ["PENDING", "CONFIRMED", "ARCHIVED"],
  CONFIRMED: ["NEEDS_REVIEW", "ARCHIVED"],
  ARCHIVED: ["NEEDS_REVIEW"],
};

function assertValidTransition(from: ClassificationStatus, to: ClassificationStatus) {
  if (from === to) return;
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Transition de statut invalide : ${from} → ${to}`);
  }
}

const productFiltersSchema = z.object({
  status: classificationStatusSchema.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

export async function getProducts(filters: ProductFilters = {}) {
  const { orgId } = await requireOrgContext();
  const { status, search, page = 1, limit = 50 } = productFiltersSchema.parse(filters);

  // biome-ignore lint/suspicious/noExplicitAny: prisma object bypass
  const where: any = { orgId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const cacheKey = ["products", orgId, JSON.stringify({ status, search, page, limit })];

  const cached = unstable_cache(
    async () => {
      const products = await prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          sku: true,
          materialType: true,
          weightG: true,
          status: true,
          ecoOrganism: true,
          packagingType: true,
          isReusable: true,
          reuseCount: true,
        },
      });

      const total = await prisma.product.count({ where });

      return { products, total, totalPages: Math.ceil(total / limit) };
    },
    cacheKey,
    { revalidate: 15, tags: [`products:${orgId}`] },
  );

  return await cached();
}

export async function updateProductClassification(
  productId: string,
  data: {
    materialType?: MaterialType;
    ecoOrganism?: EcoOrganism;
    packagingType?: string;
    isReusable?: boolean;
    reuseCount?: number;
    weightG?: number;
    status: ClassificationStatus;
  },
) {
  await assertSameOrigin();
  const parsedProductId = z.string().min(1).parse(productId);
  const parsedData = z
    .object({
      materialType: materialTypeSchema.optional(),
      ecoOrganism: ecoOrganismSchema.optional(),
      packagingType: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]).default("PRIMARY"),
      isReusable: z.boolean().default(false),
      reuseCount: z.number().int().min(0).default(0),
      weightG: z.coerce.number().min(0).max(100000).optional(),
      status: classificationStatusSchema,
    })
    .refine((data) => !data.isReusable || data.reuseCount > 0, {
      message: "Le nombre de réutilisations doit être supérieur à 0 pour un emballage réemployable",
      path: ["reuseCount"],
    })
    .parse(data);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const existing = await prisma.product.findFirst({
    where: { id: parsedProductId, orgId },
    select: { status: true },
  });
  if (!existing) throw new Error("Product not found");
  assertValidTransition(existing.status as ClassificationStatus, parsedData.status);

  const result = await prisma.product.updateMany({
    where: { id: parsedProductId, orgId },
    data: {
      ...parsedData,
      packagingType: parsedData.packagingType,
      isReusable: parsedData.isReusable,
      reuseCount: parsedData.reuseCount,
      classificationSource: "MANUAL",
    },
  });
  if (result.count === 0) throw new Error("Product not found");

  const updatedProduct = await prisma.product.findFirst({
    where: { id: parsedProductId, orgId },
    select: {
      id: true,
      name: true,
      sku: true,
      materialType: true,
      weightG: true,
      status: true,
      ecoOrganism: true,
      packagingType: true,
      isReusable: true,
      reuseCount: true,
    },
  });

  revalidatePath("/dashboard/products");

  logAuditEvent({
    orgId,
    action: "PRODUCT_CLASSIFIED",
    entityType: "Product",
    entityId: parsedProductId,
    details: {
      materialType: parsedData.materialType,
      ecoOrganism: parsedData.ecoOrganism,
      status: parsedData.status,
      method: "MANUAL",
    },
  });

  return updatedProduct;
}

export async function bulkUpdateProducts(
  productIds: string[],
  data: {
    materialType?: MaterialType;
    ecoOrganism?: EcoOrganism;
    status: ClassificationStatus;
  },
) {
  await assertSameOrigin();
  const parsedIds = z.array(z.string().min(1)).min(1).max(200).parse(productIds);
  const parsedData = z
    .object({
      materialType: materialTypeSchema.optional(),
      ecoOrganism: ecoOrganismSchema.optional(),
      status: classificationStatusSchema,
    })
    .parse(data);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const existingProducts = await prisma.product.findMany({
    where: { id: { in: parsedIds }, orgId },
    select: { id: true, status: true },
  });
  for (const product of existingProducts) {
    assertValidTransition(product.status as ClassificationStatus, parsedData.status);
  }

  const result = await prisma.product.updateMany({
    where: {
      id: { in: parsedIds },
      orgId,
    },
    data: {
      ...parsedData,
      classificationSource: "MANUAL",
    },
  });

  revalidatePath("/dashboard/products");
  return { updatedCount: result.count };
}

export async function deleteProduct(productId: string) {
  await assertSameOrigin();
  const parsedProductId = z.string().min(1).parse(productId);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const result = await prisma.product.deleteMany({
    where: { id: parsedProductId, orgId },
  });
  if (result.count === 0) {
    throw new Error("Product not found");
  }

  revalidatePath("/dashboard/products");
}

export async function bulkDeleteProducts(productIds: string[]) {
  await assertSameOrigin();
  const parsedIds = z.array(z.string().min(1)).min(1).max(200).parse(productIds);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const result = await prisma.product.deleteMany({
    where: {
      id: { in: parsedIds },
      orgId,
    },
  });

  revalidatePath("/dashboard/products");
  return { deletedCount: result.count };
}
