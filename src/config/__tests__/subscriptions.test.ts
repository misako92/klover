import { describe, expect, it } from "vitest";

import { DEFAULT_PLAN, PLANS } from "../subscriptions";

describe("subscriptions config", () => {
  it("has exactly 4 plans: free, starter, growth, enterprise", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "starter", "growth", "enterprise"]);
  });

  it("default plan is free", () => {
    expect(DEFAULT_PLAN).toBe("free");
  });

  it("free has lower limits than starter", () => {
    expect(PLANS.free.features.maxProducts).toBeLessThan(PLANS.starter.features.maxProducts);
  });

  it("starter has lower limits than growth", () => {
    expect(PLANS.starter.features.maxProducts).toBeLessThan(PLANS.growth.features.maxProducts);
  });

  it("enterprise has unlimited products", () => {
    expect(PLANS.enterprise.features.maxProducts).toBe(Number.POSITIVE_INFINITY);
  });

  it("growth has integrations enabled", () => {
    expect(PLANS.growth.features.integrations).toBe(true);
  });

  it("starter does not have advanced analytics", () => {
    expect(PLANS.starter.features.advancedAnalytics).toBe(false);
  });

  it("free cannot export", () => {
    expect(PLANS.free.features.canExport).toBe(false);
  });

  it("paid plans have canExport", () => {
    expect(PLANS.starter.features.canExport).toBe(true);
    expect(PLANS.growth.features.canExport).toBe(true);
    expect(PLANS.enterprise.features.canExport).toBe(true);
  });

  it("plan prices are consistent with marketing", () => {
    expect(PLANS.free.price).toBe("Gratuit");
    expect(PLANS.starter.price).toBe("49€/mois");
    expect(PLANS.growth.price).toBe("149€/mois");
    expect(PLANS.enterprise.price).toBe("Sur devis");
  });
});
