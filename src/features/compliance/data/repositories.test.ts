import { describe, expect, it } from "vitest";

import { buildAnalytics, buildKpis } from "./repositories";
import type { LocalDb, ProductRecord } from "./types";

// Helper to create a minimal valid mock DB
const createMockDb = (products: Partial<ProductRecord>[] = []): LocalDb => ({
  products: products.map((p, i) => ({
    id: `prod-${i}`,
    sku: `SKU-${i}`,
    name: `Product ${i}`,
    status: "TO_REVIEW",
    quantitySold: 1,
    materialType: null,
    weightG: null,
    ecoOrganism: null,
    confidence: 0,
    classificationSource: "HEURISTIC",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...p,
  })) as ProductRecord[],
  imports: [],
  declarations: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    importSources: { csvEnabled: true, shopifyPlanned: false, amazonPlanned: false },
    modulation: { status: "PLANNED", note: "" },
  },
});

describe("Repositories Logic", () => {
  describe("buildKpis", () => {
    it("should calculate zero values for empty DB", () => {
      const db = createMockDb([]);
      const kpis = buildKpis(db);
      expect(kpis.totalTonnageKg).toBe(0);
      expect(kpis.estimatedContributionEur).toBe(0);
      expect(kpis.classifiedRate).toBe(0);
    });

    it("should calculate tonnage correctly for classified products", () => {
      const db = createMockDb([
        {
          status: "CLASSIFIED",
          weightG: 1000, // 1kg
          quantitySold: 10,
          materialType: "CARDBOARD",
        },
        {
          status: "CLASSIFIED",
          weightG: 500, // 0.5kg
          quantitySold: 20,
          materialType: "PLASTIC_PET",
        },
      ]);

      const kpis = buildKpis(db);
      // (1kg * 10) + (0.5kg * 20) = 10 + 10 = 20 tons? No, weightG is grams.
      // (1000 * 10) + (500 * 20) = 10000 + 10000 = 20000g = 20kg.
      // Wait, let's check the logic in repositories.ts:
      // return sum + (product.weightG * product.quantitySold) / 1000; -> This returns kg.

      expect(kpis.totalTonnageKg).toBe(20);
    });

    it("should calculate completion rate properly", () => {
      const db = createMockDb([
        { status: "CLASSIFIED" },
        { status: "TO_REVIEW" },
        { status: "TO_REVIEW" },
        { status: "CLASSIFIED" },
      ]);
      const kpis = buildKpis(db);
      expect(kpis.classifiedRate).toBe(50); // 2/4
      expect(kpis.missingDataCount).toBe(2);
    });
  });

  describe("buildAnalytics", () => {
    it("should aggregate contributions by material", () => {
      // Mock contribution logic creates some value based on weight/material
      // We assume computeContributionEur is working (we could mock it, but integration test is fine here)
      const db = createMockDb([
        {
          status: "CLASSIFIED",
          materialType: "GLASS",
          weightG: 500,
          quantitySold: 100,
          ecoOrganism: "CITEO",
        },
      ]);

      const analytics = buildAnalytics(db);
      expect(analytics.byMaterial).toHaveLength(1);
      expect(analytics.byMaterial[0].key).toBe("GLASS");
      expect(analytics.byMaterial[0].valueEur).toBeGreaterThan(0);
    });
  });
});
