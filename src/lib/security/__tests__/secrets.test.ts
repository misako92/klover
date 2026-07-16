import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret } from "../secrets";

const originalKey = process.env.KLOVER_ENCRYPTION_KEY;
const originalNodeEnv = process.env.NODE_ENV;

describe("secret encryption", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.KLOVER_ENCRYPTION_KEY;
    } else {
      process.env.KLOVER_ENCRYPTION_KEY = originalKey;
    }

    if (originalNodeEnv === undefined) {
      vi.unstubAllEnvs();
    } else {
      vi.stubEnv("NODE_ENV", originalNodeEnv);
    }
  });

  it("round-trips secrets when an encryption key is configured", () => {
    process.env.KLOVER_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const encrypted = encryptSecret("top-secret");

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(decryptSecret(encrypted)).toBe("top-secret");
  });

  it("falls back to plaintext outside production when no key is configured", () => {
    delete process.env.KLOVER_ENCRYPTION_KEY;

    expect(encryptSecret("plain-secret")).toBe("plain-secret");
    expect(decryptSecret("plain-secret")).toBe("plain-secret");
  });
});
