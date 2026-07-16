import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertOrgAccess: vi.fn(),
  assertSameOrigin: vi.fn(),
  findMany: vi.fn(),
  requireUser: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mocks.setCookie,
  })),
}));

vi.mock("@/lib/auth/context", () => ({
  assertOrgAccess: mocks.assertOrgAccess,
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/db", () => ({
  default: {
    organizationMember: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/lib/security/csrf", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

import { setCurrentOrganization } from "../organizations";

describe("setCurrentOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertOrgAccess.mockResolvedValue({ membership: { orgId: "org-1" } });
  });

  it("stores the validated organization in the org cookie", async () => {
    await setCurrentOrganization("org-1");

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.assertOrgAccess).toHaveBeenCalledWith("org-1");
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "org_id",
      "org-1",
      expect.objectContaining({
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      }),
    );
  });

  it("rejects an empty organization id before writing the cookie", async () => {
    await expect(setCurrentOrganization("")).rejects.toThrow();

    expect(mocks.assertOrgAccess).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});
