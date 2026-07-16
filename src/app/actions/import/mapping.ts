"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { processCSVImport } from "@/services/process-csv";
import type { ImportMapping } from "@/types/mock-import";

const MappingSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  quantity: z.string().min(1).max(100),
});

export async function saveMappingAndStartProcessing(sessionId: string, mapping: ImportMapping) {
  await assertSameOrigin();
  const parsedSessionId = z.string().min(1).parse(sessionId);
  MappingSchema.parse(mapping);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  try {
    // 1. Verify Ownership
    const session = await prisma.importSession.findUnique({
      where: { id: parsedSessionId },
    });

    if (!session || session.orgId !== orgId) {
      throw new Error("Session not found or unauthorized");
    }

    // 2. Update Status to PROCESSING
    await prisma.importSession.update({
      where: { id: parsedSessionId },
      data: {
        status: "PROCESSING",
      },
    });

    // 3. Process the CSV — parse, upsert products, auto-classify
    const result = await processCSVImport(parsedSessionId, orgId, mapping, session.fileUrl);

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/products");
    return {
      success: result.success,
      created: result.created,
      updated: result.updated,
      errors: result.errors,
    };
  } catch (e) {
    console.error("[LEGACY IMPORT PIPELINE ERROR]", e);
    throw e;
  }
}
