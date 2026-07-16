import { describe, expect, it } from "vitest";

import { normalizeExternalServiceUrl } from "../external-url";

describe("normalizeExternalServiceUrl", () => {
  it("forces https and trims trailing slashes", () => {
    expect(normalizeExternalServiceUrl("example.com/")).toBe("https://example.com");
  });

  it("rejects local and private hosts", () => {
    expect(() => normalizeExternalServiceUrl("http://localhost:3000")).toThrow();
    expect(() => normalizeExternalServiceUrl("https://192.168.1.12")).toThrow();
  });

  it("restricts Shopify connections to myshopify domains", () => {
    expect(() =>
      normalizeExternalServiceUrl("https://not-shopify.example.com", {
        restrictToShopifyDomain: true,
      }),
    ).toThrow();
  });
});
