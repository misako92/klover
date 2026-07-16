import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  encryptSecret: vi.fn((value: string | null | undefined) => (value ? `enc:${value}` : null)),
  requireOrgContext: vi.fn(),
  requireOrgRole: vi.fn(),
  revalidatePath: vi.fn(),
  logAuditEvent: vi.fn(),
  ecoOrganismFindMany: vi.fn(),
  ecoOrganismFindUnique: vi.fn(),
  ecoOrganismUpsert: vi.fn(),
  ecoOrganismDeleteMany: vi.fn(),
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
    ecoOrganismConfig: {
      findMany: mocks.ecoOrganismFindMany,
      findUnique: mocks.ecoOrganismFindUnique,
      upsert: mocks.ecoOrganismUpsert,
      deleteMany: mocks.ecoOrganismDeleteMany,
    },
  },
}));

vi.mock("@/lib/security/csrf", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

vi.mock("@/lib/security/secrets", () => ({
  encryptSecret: mocks.encryptSecret,
}));

vi.mock("@/services/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

import { disconnectEcoOrganism, getEcoOrganismConfigs, saveEcoOrganismConfig } from "../eco-organisms";

describe("eco-organism actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrgContext.mockResolvedValue({
      orgId: "org-1",
      membership: { role: "OWNER" },
    });
  });

  it("returns a full organism list with defaults and no secrets", async () => {
    mocks.ecoOrganismFindMany.mockResolvedValue([
      {
        organism: "CITEO",
        portalLogin: "ops@brand.test",
        status: "CONNECTED",
        lastSyncAt: new Date("2026-03-01T08:00:00.000Z"),
        updatedAt: new Date("2026-03-01T08:05:00.000Z"),
        apiKey: "enc:key",
        apiSecret: null,
      },
    ]);

    const result = await getEcoOrganismConfigs();

    expect(result.role).toBe("OWNER");
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toEqual({
      organism: "CITEO",
      portalLogin: "ops@brand.test",
      status: "CONNECTED",
      lastSyncAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-03-01T08:05:00.000Z",
      hasApiKey: true,
      hasApiSecret: false,
    });
    expect(result.items[1]?.status).toBe("DISCONNECTED");
  });

  it("saves configs with encrypted secrets and preserves existing secrets when omitted", async () => {
    mocks.ecoOrganismFindUnique.mockResolvedValue({
      apiKey: "enc:old-key",
      apiSecret: "enc:old-secret",
    });

    await saveEcoOrganismConfig({
      organism: "LEKO",
      portalLogin: "rep@brand.test",
      apiKey: "",
      apiSecret: "new-secret",
    });

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.requireOrgRole).toHaveBeenCalledWith({ role: "OWNER" }, ["OWNER", "ADMIN"]);
    expect(mocks.encryptSecret).toHaveBeenCalledWith("new-secret");
    expect(mocks.ecoOrganismUpsert).toHaveBeenCalledWith({
      where: {
        orgId_organism: {
          orgId: "org-1",
          organism: "LEKO",
        },
      },
      create: {
        orgId: "org-1",
        organism: "LEKO",
        portalLogin: "rep@brand.test",
        apiKey: "enc:old-key",
        apiSecret: "enc:new-secret",
        status: "CONNECTED",
        lastSyncAt: null,
      },
      update: {
        portalLogin: "rep@brand.test",
        apiKey: "enc:old-key",
        apiSecret: "enc:new-secret",
        status: "CONNECTED",
      },
    });
  });

  it("disconnects configs within the current org scope", async () => {
    await disconnectEcoOrganism("CITEO");

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.ecoOrganismDeleteMany).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        organism: "CITEO",
      },
    });
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        action: "ECO_ORGANISM_CONFIG_DISCONNECTED",
        details: { organism: "CITEO" },
      }),
    );
  });
});
