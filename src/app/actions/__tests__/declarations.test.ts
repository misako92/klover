import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceFeatureAccess: vi.fn(),
  assertSameOrigin: vi.fn(),
  findExisting: vi.fn(),
  findProducts: vi.fn(),
  createDeclaration: vi.fn(),
  requireOrgContext: vi.fn(),
  requireOrgRole: vi.fn(),
  revalidatePath: vi.fn(),
  simulateContribution: vi.fn(),
  getActiveTariffProfileForDate: vi.fn(),
  logAuditEvent: vi.fn(),
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
    complianceDeclaration: {
      findFirst: mocks.findExisting,
      create: mocks.createDeclaration,
      updateMany: vi.fn(),
    },
    product: {
      findMany: mocks.findProducts,
    },
  },
}));

vi.mock("@/lib/compliance/tariff-profiles", () => ({
  getActiveTariffProfileForDate: mocks.getActiveTariffProfileForDate,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

vi.mock("@/services/contribution", () => ({
  simulateContribution: mocks.simulateContribution,
}));

vi.mock("@/services/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

vi.mock("@/lib/subscription/plan-limits", () => ({
  enforceFeatureAccess: mocks.enforceFeatureAccess,
}));

import { createDeclaration } from "../declarations";

describe("createDeclaration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrgContext.mockResolvedValue({
      orgId: "org-1",
      membership: { role: "OWNER" },
    });
    mocks.findExisting.mockResolvedValue(null);
    mocks.findProducts.mockResolvedValue([
      {
        weightG: 2000,
        materialType: "GLASS",
        ecoOrganism: "CITEO",
        packagingType: "PRIMARY",
        isReusable: false,
        reuseCount: 0,
        quantitySold: 3,
      },
    ]);
    mocks.simulateContribution.mockReturnValue({
      totalCents: 12345,
      totalWeightG: 6000,
    });
    mocks.getActiveTariffProfileForDate.mockResolvedValue({
      id: "tariff-1",
      ecoOrganism: "CITEO",
      versionLabel: "REP Emballages 2026",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveTo: null,
      notes: null,
      isActive: true,
      source: "database",
      config: {
        primaryEurPerKg: {
          PLASTIC_PET: 0.54,
          PLASTIC: 0.62,
          CARDBOARD: 0.24,
          GLASS: 0.17,
          ALUMINUM: 0.41,
          STEEL: 0.31,
          WOOD: 0.18,
          TEXTILE: 0.58,
          COMPOSITE: 0.72,
          UNKNOWN: 0.95,
        },
        proEurPerKg: {
          PLASTIC_PET: 0.28,
          PLASTIC: 0.32,
          CARDBOARD: 0.12,
          GLASS: 0.09,
          ALUMINUM: 0.22,
          STEEL: 0.16,
          WOOD: 0.09,
          TEXTILE: 0.3,
          COMPOSITE: 0.38,
          UNKNOWN: 0.5,
        },
        reusableDiscountPerReusePct: 5,
        reusableDiscountCapPct: 50,
      },
    });
    mocks.createDeclaration.mockResolvedValue({ id: "decl-1" });
  });

  it("creates a scoped declaration with normalized period and snapshot totals", async () => {
    await createDeclaration(new Date("2026-07-31T22:45:00.000Z"), "CITEO");

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.requireOrgRole).toHaveBeenCalledWith({ role: "OWNER" }, ["OWNER", "ADMIN"]);
    expect(mocks.findProducts).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        ecoOrganism: "CITEO",
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

    const createArgs = mocks.createDeclaration.mock.calls[0]?.[0];
    expect(createArgs.data.orgId).toBe("org-1");
    expect(createArgs.data.ecoOrganism).toBe("CITEO");
    expect(createArgs.data.period.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(createArgs.data.totals).toEqual({
      totalAmountCents: 12345,
      totalTonnageKg: 6,
      productCount: 1,
      tariffProfileId: "tariff-1",
      tariffVersionLabel: "REP Emballages 2026",
      tariffEffectiveFrom: "2026-01-01T00:00:00.000Z",
      tariffSource: "database",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/declarations");
    expect(mocks.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        action: "DECLARATION_CREATED",
        entityId: "decl-1",
      }),
    );
  });

  it("rejects duplicate declarations for the same period and eco-organism", async () => {
    mocks.findExisting.mockResolvedValue({ id: "existing-decl" });

    await expect(createDeclaration(new Date("2026-07-01T00:00:00.000Z"), "CITEO")).rejects.toThrow();

    expect(mocks.createDeclaration).not.toHaveBeenCalled();
    expect(mocks.findProducts).not.toHaveBeenCalled();
  });
});
