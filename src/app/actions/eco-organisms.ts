"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { encryptSecret } from "@/lib/security/secrets";
import { logAuditEvent } from "@/services/audit";

const ecoOrganismSchema = z.enum(["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"]);

const ecoOrganismConfigSchema = z.object({
  organism: ecoOrganismSchema,
  portalLogin: z.string().trim().max(255).optional(),
  apiKey: z.string().trim().max(500).optional(),
  apiSecret: z.string().trim().max(500).optional(),
});

function sanitizeOptionalValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getEcoOrganismConfigs() {
  const { orgId, membership } = await requireOrgContext();

  const configs = await prisma.ecoOrganismConfig.findMany({
    where: { orgId },
    select: {
      organism: true,
      portalLogin: true,
      status: true,
      lastSyncAt: true,
      updatedAt: true,
      apiKey: true,
      apiSecret: true,
    },
  });

  const byOrganism = new Map(configs.map((config) => [config.organism, config]));

  return {
    role: membership.role,
    items: ecoOrganismSchema.options.map((organism) => {
      const existing = byOrganism.get(organism);

      return {
        organism,
        portalLogin: existing?.portalLogin ?? "",
        status: existing?.status ?? "DISCONNECTED",
        lastSyncAt: existing?.lastSyncAt?.toISOString() ?? null,
        updatedAt: existing?.updatedAt.toISOString() ?? null,
        hasApiKey: Boolean(existing?.apiKey),
        hasApiSecret: Boolean(existing?.apiSecret),
      };
    }),
  };
}

export async function saveEcoOrganismConfig(input: z.infer<typeof ecoOrganismConfigSchema>) {
  await assertSameOrigin();
  const parsed = ecoOrganismConfigSchema.parse(input);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const existing = await prisma.ecoOrganismConfig.findUnique({
    where: {
      orgId_organism: {
        orgId,
        organism: parsed.organism,
      },
    },
    select: {
      apiKey: true,
      apiSecret: true,
    },
  });

  const portalLogin = sanitizeOptionalValue(parsed.portalLogin);
  const nextApiKey = sanitizeOptionalValue(parsed.apiKey);
  const nextApiSecret = sanitizeOptionalValue(parsed.apiSecret);
  const encryptedApiKey = nextApiKey ? encryptSecret(nextApiKey) : (existing?.apiKey ?? null);
  const encryptedApiSecret = nextApiSecret ? encryptSecret(nextApiSecret) : (existing?.apiSecret ?? null);

  if (!portalLogin && !encryptedApiKey && !encryptedApiSecret) {
    throw new Error("Ajoutez au moins un identifiant portail ou une cle API avant de sauvegarder.");
  }

  await prisma.ecoOrganismConfig.upsert({
    where: {
      orgId_organism: {
        orgId,
        organism: parsed.organism,
      },
    },
    create: {
      orgId,
      organism: parsed.organism,
      portalLogin,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      status: "CONNECTED",
      lastSyncAt: null,
    },
    update: {
      portalLogin,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      status: "CONNECTED",
    },
  });

  await logAuditEvent({
    orgId,
    action: "ECO_ORGANISM_CONFIG_SAVED",
    entityType: "EcoOrganismConfig",
    details: {
      organism: parsed.organism,
      hasPortalLogin: Boolean(portalLogin),
      rotatedApiKey: Boolean(nextApiKey),
      rotatedApiSecret: Boolean(nextApiSecret),
    },
  });

  revalidatePath("/dashboard/eco-organismes");

  return { success: true };
}

export async function disconnectEcoOrganism(organism: string) {
  await assertSameOrigin();
  const parsedOrganism = ecoOrganismSchema.parse(organism);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  await prisma.ecoOrganismConfig.deleteMany({
    where: {
      orgId,
      organism: parsedOrganism,
    },
  });

  await logAuditEvent({
    orgId,
    action: "ECO_ORGANISM_CONFIG_DISCONNECTED",
    entityType: "EcoOrganismConfig",
    details: { organism: parsedOrganism },
  });

  revalidatePath("/dashboard/eco-organismes");

  return { success: true };
}
