import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  decryptSecret: vi.fn((value: string | null | undefined) => `plain:${value ?? ""}`),
  encryptSecret: vi.fn((value: string | null | undefined) => (value ? `enc:${value}` : null)),
  normalizeExternalServiceUrl: vi.fn((url: string) => `https://${url.replace(/^https?:\/\//, "").replace(/\/$/, "")}`),
  requireOrgContext: vi.fn(),
  requireOrgRole: vi.fn(),
  revalidatePath: vi.fn(),
  logAuditEvent: vi.fn(),
  integrationFindMany: vi.fn(),
  integrationUpsert: vi.fn(),
  integrationFindUnique: vi.fn(),
  integrationUpdateMany: vi.fn(),
  shopifyTestConnection: vi.fn(),
  shopifySyncProducts: vi.fn(),
  shopifySyncOrders: vi.fn(),
  wooTestConnection: vi.fn(),
  wooSyncProducts: vi.fn(),
  wooSyncOrders: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth/context", () => ({
  requireOrgContext: mocks.requireOrgContext,
  requireOrgRole: mocks.requireOrgRole,
}));

vi.mock("@/lib/db", () => ({
  default: {
    integration: {
      findMany: mocks.integrationFindMany,
      upsert: mocks.integrationUpsert,
      findUnique: mocks.integrationFindUnique,
      updateMany: mocks.integrationUpdateMany,
    },
  },
}));

vi.mock("@/lib/security/csrf", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

vi.mock("@/lib/security/external-url", () => ({
  normalizeExternalServiceUrl: mocks.normalizeExternalServiceUrl,
}));

vi.mock("@/lib/security/secrets", () => ({
  decryptSecret: mocks.decryptSecret,
  encryptSecret: mocks.encryptSecret,
}));

vi.mock("@/services/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

vi.mock("@/lib/subscription/plan-limits", () => ({
  enforceFeatureAccess: vi.fn(),
}));

vi.mock("@/services/integrations/shopify", () => ({
  ShopifyConnector: class {
    testConnection = mocks.shopifyTestConnection;
    syncProducts = mocks.shopifySyncProducts;
    syncOrders = mocks.shopifySyncOrders;
  },
}));

vi.mock("@/services/integrations/woocommerce", () => ({
  WooCommerceConnector: class {
    testConnection = mocks.wooTestConnection;
    syncProducts = mocks.wooSyncProducts;
    syncOrders = mocks.wooSyncOrders;
  },
}));

import { saveIntegration, syncIntegration } from "../integrations";

describe("integration actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrgContext.mockResolvedValue({
      orgId: "org-1",
      membership: { role: "OWNER" },
    });
    mocks.shopifyTestConnection.mockResolvedValue({ success: true, shopName: "My Shop" });
    mocks.shopifySyncProducts.mockResolvedValue({
      success: true,
      syncedCount: 8,
      createdCount: 3,
      updatedCount: 5,
      skippedCount: 0,
      errors: [],
    });
    mocks.shopifySyncOrders.mockResolvedValue({
      success: true,
      syncedCount: 2,
      createdCount: 2,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    });
  });

  it("saves integrations with normalized urls and encrypted secrets", async () => {
    await saveIntegration({
      platform: "shopify",
      shopUrl: "my-shop.myshopify.com",
      accessToken: "token-123",
    });

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.normalizeExternalServiceUrl).toHaveBeenCalledWith("my-shop.myshopify.com", {
      restrictToShopifyDomain: true,
    });
    expect(mocks.encryptSecret).toHaveBeenCalledWith("token-123");
    expect(mocks.integrationUpsert).toHaveBeenCalledWith({
      where: {
        orgId_platform: { orgId: "org-1", platform: "shopify" },
      },
      create: expect.objectContaining({
        orgId: "org-1",
        shopUrl: "https://my-shop.myshopify.com",
        accessToken: "enc:token-123",
      }),
      update: expect.objectContaining({
        shopUrl: "https://my-shop.myshopify.com",
        accessToken: "enc:token-123",
      }),
    });
  });

  it("stores sync counters as last-run values instead of cumulative increments", async () => {
    mocks.integrationFindUnique.mockResolvedValue({
      id: "int-1",
      orgId: "org-1",
      platform: "shopify",
      shopUrl: "https://my-shop.myshopify.com",
      accessToken: "enc-token",
      apiKey: null,
      apiSecret: null,
      isActive: true,
    });

    await syncIntegration("shopify", "all");

    expect(mocks.decryptSecret).toHaveBeenCalledWith("enc-token");
    expect(mocks.integrationUpdateMany).toHaveBeenCalledWith({
      where: { id: "int-1", orgId: "org-1" },
      data: {
        lastSyncAt: expect.any(Date),
        productCount: 8,
        orderCount: 2,
      },
    });
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          productsSynced: 8,
          productsCreated: 3,
          productsUpdated: 5,
          ordersSynced: 2,
          ordersCreated: 2,
        }),
      }),
    );
  });
});
