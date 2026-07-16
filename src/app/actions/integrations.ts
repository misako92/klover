"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { normalizeExternalServiceUrl } from "@/lib/security/external-url";
import { decryptSecret, encryptSecret } from "@/lib/security/secrets";
import { enforceFeatureAccess } from "@/lib/subscription/plan-limits";
import { logAuditEvent } from "@/services/audit";
import { ShopifyConnector } from "@/services/integrations/shopify";
import type { EcommerceConnector } from "@/services/integrations/types";
import { WooCommerceConnector } from "@/services/integrations/woocommerce";

const platformSchema = z.enum(["shopify", "woocommerce"]);

const credentialsSchema = z.object({
  platform: platformSchema,
  shopUrl: z.string().trim().min(3, "URL du shop requise"),
  accessToken: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
});

function sanitizeOptionalSecret(value?: null | string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseCredentials(data: z.infer<typeof credentialsSchema>) {
  const parsed = credentialsSchema.parse(data);

  return {
    ...parsed,
    shopUrl: normalizeExternalServiceUrl(parsed.shopUrl, {
      restrictToShopifyDomain: parsed.platform === "shopify",
    }),
    accessToken: sanitizeOptionalSecret(parsed.accessToken),
    apiKey: sanitizeOptionalSecret(parsed.apiKey),
    apiSecret: sanitizeOptionalSecret(parsed.apiSecret),
  };
}

function createConnector(
  platform: string,
  shopUrl: string,
  accessToken?: string | null,
  apiKey?: string | null,
  apiSecret?: string | null,
): EcommerceConnector {
  switch (platform) {
    case "shopify":
      if (!accessToken) throw new Error("Access Token requis pour Shopify");
      return new ShopifyConnector(shopUrl, accessToken);
    case "woocommerce":
      if (!apiKey || !apiSecret) throw new Error("Consumer Key et Secret requis pour WooCommerce");
      return new WooCommerceConnector(shopUrl, apiKey, apiSecret);
    default:
      throw new Error(`Plateforme non supportée: ${platform}`);
  }
}

export async function getIntegrations() {
  const { orgId } = await requireOrgContext();

  return prisma.integration.findMany({
    where: { orgId },
    select: {
      id: true,
      platform: true,
      shopUrl: true,
      isActive: true,
      lastSyncAt: true,
      productCount: true,
      orderCount: true,
    },
  });
}

export async function testIntegrationConnection(data: z.infer<typeof credentialsSchema>) {
  await assertSameOrigin();
  const parsed = parseCredentials(data);
  const { membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);
  await enforceFeatureAccess("integrations", "Les connecteurs e-commerce");

  const connector = createConnector(
    parsed.platform,
    parsed.shopUrl,
    parsed.accessToken,
    parsed.apiKey,
    parsed.apiSecret,
  );

  return connector.testConnection();
}

export async function saveIntegration(data: z.infer<typeof credentialsSchema>) {
  await assertSameOrigin();
  await enforceFeatureAccess("integrations", "Les connecteurs e-commerce");
  const parsed = parseCredentials(data);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const connector = createConnector(
    parsed.platform,
    parsed.shopUrl,
    parsed.accessToken,
    parsed.apiKey,
    parsed.apiSecret,
  );
  const test = await connector.testConnection();

  if (!test.success) {
    throw new Error(test.error || "Impossible de se connecter");
  }

  await prisma.integration.upsert({
    where: {
      orgId_platform: { orgId, platform: parsed.platform },
    },
    create: {
      orgId,
      platform: parsed.platform,
      shopUrl: parsed.shopUrl,
      accessToken: encryptSecret(parsed.accessToken),
      apiKey: encryptSecret(parsed.apiKey),
      apiSecret: encryptSecret(parsed.apiSecret),
      isActive: true,
    },
    update: {
      shopUrl: parsed.shopUrl,
      accessToken: encryptSecret(parsed.accessToken),
      apiKey: encryptSecret(parsed.apiKey),
      apiSecret: encryptSecret(parsed.apiSecret),
      isActive: true,
    },
  });

  logAuditEvent({
    orgId,
    action: "INTEGRATION_CONNECTED",
    entityType: "Integration",
    details: { platform: parsed.platform, shopUrl: parsed.shopUrl },
  });

  revalidatePath("/dashboard/integrations");
  return { success: true, shopName: test.shopName };
}

export async function syncIntegration(platform: string, type: "products" | "orders" | "all") {
  await assertSameOrigin();
  await enforceFeatureAccess("integrations", "La synchronisation e-commerce");
  const parsedPlatform = platformSchema.parse(platform);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  const integration = await prisma.integration.findUnique({
    where: {
      orgId_platform: { orgId, platform: parsedPlatform },
    },
  });

  if (!integration || !integration.isActive) {
    throw new Error("Intégration non configurée ou inactive");
  }

  const connector = createConnector(
    integration.platform,
    integration.shopUrl,
    decryptSecret(integration.accessToken),
    decryptSecret(integration.apiKey),
    decryptSecret(integration.apiSecret),
  );

  const results: {
    products?: Awaited<ReturnType<EcommerceConnector["syncProducts"]>>;
    orders?: Awaited<ReturnType<EcommerceConnector["syncOrders"]>>;
  } = {};

  if (type === "products" || type === "all") {
    results.products = await connector.syncProducts(orgId);
  }
  if (type === "orders" || type === "all") {
    results.orders = await connector.syncOrders(orgId);
  }

  await prisma.integration.updateMany({
    where: { id: integration.id, orgId },
    data: {
      lastSyncAt: new Date(),
      productCount: results.products ? results.products.syncedCount : undefined,
      orderCount: results.orders ? results.orders.syncedCount : undefined,
    },
  });

  logAuditEvent({
    orgId,
    action: "INTEGRATION_SYNCED",
    entityType: "Integration",
    details: {
      platform: parsedPlatform,
      type,
      productsSynced: results.products?.syncedCount ?? 0,
      productsCreated: results.products?.createdCount ?? 0,
      productsUpdated: results.products?.updatedCount ?? 0,
      ordersSynced: results.orders?.syncedCount ?? 0,
      ordersCreated: results.orders?.createdCount ?? 0,
    },
  });

  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/products");
  return results;
}

export async function disconnectIntegration(platform: string) {
  await assertSameOrigin();
  const parsedPlatform = platformSchema.parse(platform);
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER", "ADMIN"]);

  await prisma.integration.updateMany({
    where: { orgId, platform: parsedPlatform },
    data: {
      isActive: false,
      accessToken: null,
      apiKey: null,
      apiSecret: null,
    },
  });

  logAuditEvent({
    orgId,
    action: "INTEGRATION_DISCONNECTED",
    entityType: "Integration",
    details: { platform: parsedPlatform },
  });

  revalidatePath("/dashboard/integrations");
}
