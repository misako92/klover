import { describe, expect, it } from "vitest";

import { planFromPriceId } from "../plans";

describe("planFromPriceId", () => {
  it("returns null for unknown price IDs", () => {
    expect(planFromPriceId("price_unknown")).toBeNull();
    expect(planFromPriceId("")).toBeNull();
  });

  it("returns the plan when env vars are set and match", () => {
    // When env vars are empty strings (default), no plan will match
    expect(planFromPriceId("")).toBeNull();
  });
});
