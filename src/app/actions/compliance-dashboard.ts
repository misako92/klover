"use server";

import { format } from "date-fns";
import { z } from "zod";

import type { ImportRunInput, ImportRunResult, LocalDb, ProductRecord } from "@/features/compliance/data/types";
import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import { createDefaultTariffProfilesMap } from "@/lib/compliance/tariff-config";
import { getActiveTariffProfilesMap } from "@/lib/compliance/tariff-profiles";
import { validateIDU } from "@/lib/compliance-utils";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { processCSVTextImport } from "@/services/process-csv";

const mappingSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.string().min(1),
  price: z.string().optional(),
  date: z.string().optional(),
});

function toLocalMaterialType(materialType?: null | string): ProductRecord["materialType"] {
  switch (materialType) {
    case "PLASTIC":
    case "PLASTIC_PET":
    case "CARDBOARD":
    case "GLASS":
    case "ALUMINUM":
    case "STEEL":
    case "WOOD":
    case "TEXTILE":
    case "COMPOSITE":
    case "UNKNOWN":
      return materialType;
    default:
      return null;
  }
}

function toLocalProductStatus(status?: null | string): ProductRecord["status"] {
  return status === "CONFIRMED" ? "CLASSIFIED" : "TO_REVIEW";
}

function isMissingOrganizationColumn(error: unknown, columnName: string) {
  return (
    error instanceof Error &&
    error.message.includes(`Organization.${columnName}`) &&
    error.message.includes("does not exist")
  );
}

async function getOrganizationSnapshot(orgId: string) {
  try {
    return await prisma.organization.findUnique({
      where: { id: orgId },
      select: { idu: true, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    if (!isMissingOrganizationColumn(error, "idu")) {
      throw error;
    }

    const fallback = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { createdAt: true, updatedAt: true },
    });

    return fallback ? { ...fallback, idu: null } : null;
  }
}

export async function getComplianceDashboardState(): Promise<LocalDb> {
  const { orgId } = await requireOrgContext();

  const [organization, products, declarations, imports, tariffProfiles] = await Promise.all([
    getOrganizationSnapshot(orgId),
    prisma.product.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        sku: true,
        name: true,
        quantitySold: true,
        materialType: true,
        weightG: true,
        ecoOrganism: true,
        packagingType: true,
        isReusable: true,
        reuseCount: true,
        confidence: true,
        status: true,
        classificationSource: true,
        reviewReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.complianceDeclaration.findMany({
      where: { orgId },
      orderBy: { period: "desc" },
      select: {
        id: true,
        period: true,
        ecoOrganism: true,
        status: true,
        totals: true,
        createdAt: true,
        submittedAt: true,
      },
    }),
    prisma.importSession.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
      },
    }),
    getActiveTariffProfilesMap(),
  ]);

  return {
    version: 1,
    createdAt: organization?.createdAt.toISOString() ?? new Date().toISOString(),
    updatedAt: organization?.updatedAt.toISOString() ?? new Date().toISOString(),
    products: products.map((product) => ({
      id: product.id,
      sku: product.sku ?? "",
      name: product.name,
      quantitySold: product.quantitySold ?? 0,
      materialType: toLocalMaterialType(product.materialType),
      weightG: product.weightG,
      ecoOrganism: product.ecoOrganism ?? null,
      packagingType: product.packagingType ?? "PRIMARY",
      isReusable: product.isReusable ?? false,
      reuseCount: product.reuseCount ?? 0,
      confidence: product.confidence ?? 0,
      status: toLocalProductStatus(product.status),
      classificationSource: product.classificationSource as ProductRecord["classificationSource"],
      reviewReason: product.reviewReason,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })),
    declarations: declarations.map((declaration) => {
      const totals =
        declaration.totals && typeof declaration.totals === "object"
          ? (declaration.totals as Record<string, unknown>)
          : {};

      return {
        id: declaration.id,
        period: format(new Date(declaration.period), "yyyy-MM"),
        ecoOrganism: declaration.ecoOrganism,
        status: declaration.status === "ARCHIVED" ? "SUBMITTED" : declaration.status,
        estimatedAmountEur: Number(totals.totalAmountCents ?? 0) / 100,
        totalTonnageKg: Number(totals.totalTonnageKg ?? totals.totalTonnage ?? 0),
        tariffVersionLabel: typeof totals.tariffVersionLabel === "string" ? totals.tariffVersionLabel : undefined,
        tariffEffectiveFrom: typeof totals.tariffEffectiveFrom === "string" ? totals.tariffEffectiveFrom : null,
        generatedAt: declaration.createdAt.toISOString(),
        submittedAt: declaration.submittedAt?.toISOString() ?? null,
      };
    }),
    imports: imports.map((session) => ({
      id: session.id,
      fileName: session.fileName,
      importedAt: session.createdAt.toISOString(),
      period: format(new Date(session.createdAt), "yyyy-MM"),
      status: session.status === "FAILED" ? "FAILED" : "COMPLETED",
      rowCount: 0,
      createdProducts: 0,
      updatedProducts: 0,
      errorCount: session.status === "FAILED" ? 1 : 0,
      mapping: {
        sku: "sku",
        name: "name",
        quantity: "quantity",
      },
    })),
    settings: {
      importSources: {
        csvEnabled: true,
        shopifyPlanned: false,
        amazonPlanned: false,
      },
      modulation: {
        status: "PLANNED",
        note: "",
      },
      idu: organization?.idu ?? undefined,
      tariffProfiles: tariffProfiles ?? createDefaultTariffProfilesMap(),
    },
  };
}

export async function saveOrganizationIdu(idu: string) {
  await assertSameOrigin();
  const parsedIdu = z.string().trim().min(3).max(100).parse(idu);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  if (!validateIDU(parsedIdu)) {
    throw new Error("Format IDU invalide. Format attendu : FR123456_01ABCD");
  }

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { idu: parsedIdu },
    });
  } catch (error) {
    if (isMissingOrganizationColumn(error, "idu")) {
      throw new Error("La colonne Organization.idu est absente de la base. Applique d'abord la migration Prisma.");
    }
    throw error;
  }
}

export async function runCsvImport(input: ImportRunInput): Promise<ImportRunResult> {
  await assertSameOrigin();
  const parsedInput = z
    .object({
      fileName: z.string().min(1).max(255),
      csvText: z.string().min(1),
      mapping: mappingSchema,
    })
    .parse(input);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const session = await prisma.importSession.create({
    data: {
      orgId,
      fileName: parsedInput.fileName,
      fileUrl: `inline:${Date.now()}`,
      status: "PROCESSING",
    },
  });

  const result = await processCSVTextImport(session.id, orgId, parsedInput.mapping, parsedInput.csvText);

  return {
    session: {
      id: session.id,
      fileName: session.fileName,
      importedAt: session.createdAt.toISOString(),
      period: format(new Date(), "yyyy-MM"),
      status: result.success ? "COMPLETED" : "FAILED",
      rowCount: result.created + result.updated,
      createdProducts: result.created,
      updatedProducts: result.updated,
      errorCount: result.errors.length,
      mapping: parsedInput.mapping,
    },
    importedLines: result.created + result.updated,
    createdProducts: result.created,
    updatedProducts: result.updated,
    errors: result.errors,
  };
}
