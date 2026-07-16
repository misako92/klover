import { describe, expect, it } from "vitest";

import { classifyByHeuristics } from "../classification";

describe("classifyByHeuristics", () => {
  it("matches PET rule with high confidence", () => {
    const result = classifyByHeuristics({
      name: "Bouteille PET 1L",
      sku: "PET-100",
    });

    expect(result).not.toBeNull();
    expect(result?.materialType).toBe("PLASTIC_PET");
    expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("classifies carton products", () => {
    const result = classifyByHeuristics({
      name: "Boîte carton 30x20",
      sku: "BOX-001",
    });

    expect(result).not.toBeNull();
    expect(result?.materialType).toBe("CARDBOARD");
  });

  it("classifies glass products", () => {
    const result = classifyByHeuristics({
      name: "Pot en verre 500g",
      sku: "GLASS-001",
    });

    expect(result).not.toBeNull();
    expect(result?.materialType).toBe("GLASS");
  });

  it("classifies aluminum products", () => {
    const result = classifyByHeuristics({
      name: "Canette aluminium 33cl",
      sku: "ALU-001",
    });

    expect(result).not.toBeNull();
    expect(result?.materialType).toBe("ALUMINUM");
  });

  it("returns null for unrecognizable products", () => {
    const result = classifyByHeuristics({
      name: "Widget générique XYZ",
      sku: "WDG-999",
    });

    expect(result).toBeNull();
  });

  it("classification result includes ecoOrganism", () => {
    const result = classifyByHeuristics({
      name: "Flacon PET 250ml",
      sku: "PET-250",
    });

    expect(result).not.toBeNull();
    expect(result?.ecoOrganism).toBeDefined();
  });
});
