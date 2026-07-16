"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import { getActiveTariffProfileForDate } from "@/lib/compliance/tariff-profiles";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { enforceFeatureAccess } from "@/lib/subscription/plan-limits";
import { logAuditEvent } from "@/services/audit";
import { simulateContribution } from "@/services/contribution";

const ecoOrganismSchema = z.enum(["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"]);

export type EcoOrganism = z.infer<typeof ecoOrganismSchema>;
export type DeclarationStatus = "DRAFT" | "SUBMITTED" | "ARCHIVED";

export async function getDeclarations() {
  const { orgId } = await requireOrgContext();

  return prisma.complianceDeclaration.findMany({
    where: { orgId },
    orderBy: { period: "desc" },
  });
}

export async function createDeclaration(periodDate: Date, ecoOrganism: EcoOrganism) {
  await assertSameOrigin();
  const parsedPeriod = z.coerce.date().parse(periodDate);
  const parsedOrganism = ecoOrganismSchema.parse(ecoOrganism);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);
  await enforceFeatureAccess("canExport", "La creation de declarations");

  const normalizedPeriod = new Date(Date.UTC(parsedPeriod.getUTCFullYear(), parsedPeriod.getUTCMonth(), 1));

  const existing = await prisma.complianceDeclaration.findFirst({
    where: {
      orgId,
      ecoOrganism: parsedOrganism,
      period: normalizedPeriod,
    },
  });

  if (existing) {
    throw new Error("Une déclaration existe déjà pour cette période et cet éco-organisme.");
  }

  const products = await prisma.product.findMany({
    where: {
      orgId,
      ecoOrganism: parsedOrganism,
      status: "CONFIRMED",
    },
    select: {
      weightG: true,
      materialType: true,
      ecoOrganism: true,
      packagingType: true,
      isReusable: true,
      reuseCount: true,
      quantitySold: true,
    },
  });
  const tariffProfile = await getActiveTariffProfileForDate(parsedOrganism, normalizedPeriod);
  const { totalCents, totalWeightG } = simulateContribution(products, {
    tariffProfiles: {
      [parsedOrganism]: tariffProfile,
    },
  });

  const declaration = await prisma.complianceDeclaration.create({
    data: {
      orgId,
      ecoOrganism: parsedOrganism,
      period: normalizedPeriod,
      status: "DRAFT",
      totals: {
        totalAmountCents: totalCents,
        totalTonnageKg: totalWeightG / 1000,
        productCount: products.length,
        tariffProfileId: tariffProfile.id ?? null,
        tariffVersionLabel: tariffProfile.versionLabel,
        tariffEffectiveFrom: tariffProfile.effectiveFrom,
        tariffSource: tariffProfile.source,
      },
    },
  });

  revalidatePath("/dashboard/declarations");

  logAuditEvent({
    orgId,
    action: "DECLARATION_CREATED",
    entityType: "Declaration",
    entityId: declaration.id,
    details: { ecoOrganism: parsedOrganism, period: normalizedPeriod.toISOString() },
  });

  return declaration;
}

export async function submitDeclaration(id: string) {
  await assertSameOrigin();
  const parsedId = z.string().min(1).parse(id);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const result = await prisma.complianceDeclaration.updateMany({
    where: { id: parsedId, orgId, status: "DRAFT" },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  if (result.count === 0) {
    throw new Error("Declaration not found");
  }

  revalidatePath("/dashboard/declarations");
}
