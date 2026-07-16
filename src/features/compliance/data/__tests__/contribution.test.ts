import { describe, expect, it } from "vitest";

import { computeContributionEur } from "../constants";

describe("computeContributionEur", () => {
  // ─── Barèmes ménagers (PRIMARY) ───────────────────────────────────────────

  it("calcule correctement pour emballage PRIMARY CARDBOARD", () => {
    // 200g × 50 unités = 10 kg × 0.24 €/kg = 2.40 €
    expect(
      computeContributionEur({
        materialType: "CARDBOARD",
        weightG: 200,
        quantity: 50,
        packagingType: "PRIMARY",
        isReusable: false,
        reuseCount: 0,
      }),
    ).toBeCloseTo(2.4, 2);
  });

  it("calcule correctement pour emballage PRIMARY PLASTIC_PET", () => {
    // 100g × 10 = 1 kg × 0.54 = 0.54 €
    expect(
      computeContributionEur({
        materialType: "PLASTIC_PET",
        weightG: 100,
        quantity: 10,
        packagingType: "PRIMARY",
        isReusable: false,
        reuseCount: 0,
      }),
    ).toBeCloseTo(0.54, 2);
  });

  // ─── Barèmes professionnels (SECONDARY / TERTIARY) ───────────────────────

  it("utilise les tarifs pros pour SECONDARY (moins chers que ménagers)", () => {
    const pro = computeContributionEur({
      materialType: "CARDBOARD",
      weightG: 1000,
      quantity: 1,
      packagingType: "SECONDARY",
      isReusable: false,
      reuseCount: 0,
    });
    const menager = computeContributionEur({
      materialType: "CARDBOARD",
      weightG: 1000,
      quantity: 1,
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 0,
    });
    expect(pro).toBeCloseTo(0.12, 2);
    expect(pro).toBeLessThan(menager);
  });

  it("TERTIARY utilise aussi les tarifs pros", () => {
    const secondary = computeContributionEur({
      materialType: "PLASTIC",
      weightG: 500,
      quantity: 1,
      packagingType: "SECONDARY",
      isReusable: false,
      reuseCount: 0,
    });
    const tertiary = computeContributionEur({
      materialType: "PLASTIC",
      weightG: 500,
      quantity: 1,
      packagingType: "TERTIARY",
      isReusable: false,
      reuseCount: 0,
    });
    expect(secondary).toBeCloseTo(tertiary, 5);
  });

  // ─── Décote réemploi ──────────────────────────────────────────────────────

  it("applique -5% par réutilisation pour isReusable PRIMARY", () => {
    const base = computeContributionEur({
      materialType: "GLASS",
      weightG: 500,
      quantity: 1,
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 0,
    });
    const reusable5 = computeContributionEur({
      materialType: "GLASS",
      weightG: 500,
      quantity: 1,
      packagingType: "PRIMARY",
      isReusable: true,
      reuseCount: 5,
    });
    // -25% (5 × -5%)
    expect(reusable5).toBeCloseTo(base * 0.75, 4);
  });

  it("plafonne la décote réemploi à -50% (10+ réutilisations)", () => {
    const base = computeContributionEur({
      materialType: "ALUMINUM",
      weightG: 200,
      quantity: 10,
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 0,
    });
    const reusable20 = computeContributionEur({
      materialType: "ALUMINUM",
      weightG: 200,
      quantity: 10,
      packagingType: "PRIMARY",
      isReusable: true,
      reuseCount: 20,
    });
    expect(reusable20).toBeCloseTo(base * 0.5, 4);
  });

  it("n'applique pas de décote si isReusable = false (reuseCount ignoré)", () => {
    const base = computeContributionEur({
      materialType: "STEEL",
      weightG: 300,
      quantity: 5,
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 0,
    });
    const nonReusableWithCount = computeContributionEur({
      materialType: "STEEL",
      weightG: 300,
      quantity: 5,
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 10,
    });
    expect(base).toBeCloseTo(nonReusableWithCount, 5);
  });

  it("applique décote réemploi aussi sur barèmes pros (SECONDARY)", () => {
    const proBase = computeContributionEur({
      materialType: "CARDBOARD",
      weightG: 1000,
      quantity: 1,
      packagingType: "SECONDARY",
      isReusable: false,
      reuseCount: 0,
    });
    const proReusable = computeContributionEur({
      materialType: "CARDBOARD",
      weightG: 1000,
      quantity: 1,
      packagingType: "SECONDARY",
      isReusable: true,
      reuseCount: 2,
    });
    expect(proReusable).toBeCloseTo(proBase * 0.9, 4);
  });
});
