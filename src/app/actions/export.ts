"use server";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import { assertSameOrigin } from "@/lib/security/csrf";
import { enforceFeatureAccess } from "@/lib/subscription/plan-limits";
import { logAuditEvent } from "@/services/audit";
import { generateExport as generateExportService } from "@/services/export";

const exportFilterSchema = z.enum(["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"]).optional();

export async function exportData(ecoOrganism?: string, effectiveAt?: string | Date) {
  await assertSameOrigin();
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN", "MEMBER"]);
  await enforceFeatureAccess("canExport", "L'export de donnees");
  const parsedEcoOrganism = exportFilterSchema.parse(ecoOrganism);
  const parsedEffectiveAt = effectiveAt ? z.coerce.date().parse(effectiveAt) : undefined;

  const result = await generateExportService(orgId, parsedEcoOrganism, parsedEffectiveAt);

  logAuditEvent({
    orgId,
    action: "EXPORT_GENERATED",
    entityType: "Export",
    details: {
      ecoOrganism: parsedEcoOrganism || "all",
      rowCount: result.rowCount,
      effectiveAt: parsedEffectiveAt?.toISOString() ?? null,
    },
  });

  return result;
}
