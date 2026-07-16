import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getActiveTariffProfilesMap: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    product: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/lib/compliance/tariff-profiles", () => ({
  getActiveTariffProfilesMap: mocks.getActiveTariffProfilesMap,
}));

import { generateExport } from "../export";

describe("generateExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-28T09:30:00.000Z"));
    mocks.getActiveTariffProfilesMap.mockResolvedValue({
      CITEO: {
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
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports confirmed products with a clean CSV structure and filename", async () => {
    mocks.findMany.mockResolvedValue([
      {
        name: "Produit; test",
        sku: "SKU-001",
        materialType: "CARDBOARD",
        ecoOrganism: "CITEO",
        packagingType: "PRIMARY",
        isReusable: false,
        reuseCount: 0,
        classificationSource: "HEURISTIC",
        confidence: 0.92,
        weightG: 200,
        quantitySold: 3,
      },
    ]);

    const result = await generateExport("org-1", "CITEO");

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        status: "CONFIRMED",
        ecoOrganism: "CITEO",
      },
      orderBy: { name: "asc" },
      select: {
        name: true,
        sku: true,
        materialType: true,
        ecoOrganism: true,
        packagingType: true,
        isReusable: true,
        reuseCount: true,
        classificationSource: true,
        confidence: true,
        weightG: true,
        quantitySold: true,
      },
    });

    expect(result.filename).toBe("klover-export-citeo-2026-02-28.csv");
    expect(result.rowCount).toBe(1);

    const lines = result.csv.split("\r\n");
    expect(lines[0]?.charCodeAt(0)).toBe(0xfeff);
    expect(lines[0]).toContain("Nom produit");
    expect(lines[0]).toContain("Source de classification");
    expect(lines[0]).toContain("Version bareme");
    expect(lines[1]).toBe(
      'SKU-001;"Produit; test";Carton;Primaire;200;3;0.600;CITEO;Non;0;Heuristique;92;0.14;REP Emballages 2026;2026-01-01',
    );
  });

  it("normalizes missing values without falling back to fake export data", async () => {
    mocks.findMany.mockResolvedValue([
      {
        name: "Produit incomplet",
        sku: null,
        materialType: null,
        ecoOrganism: null,
        packagingType: null,
        isReusable: true,
        reuseCount: null,
        classificationSource: null,
        confidence: 0,
        weightG: null,
        quantitySold: null,
      },
    ]);

    const result = await generateExport("org-2");

    expect(result.filename).toBe("klover-export-global-2026-02-28.csv");
    expect(result.rowCount).toBe(1);
    expect(result.csv).toContain(
      "-;Produit incomplet;Non classe;Primaire;0;0;0.000;-;Oui;0;-;-;0.00;REP Emballages 2026;2026-01-01",
    );
  });
});
