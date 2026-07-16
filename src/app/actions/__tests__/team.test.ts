import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  set: vi.fn(),
};

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  requireOrgContext: vi.fn(),
  requireOrgRole: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
  sendEmail: vi.fn(),
  logAuditEvent: vi.fn(),
  orgFindUnique: vi.fn(),
  orgMemberFindMany: vi.fn(),
  orgMemberFindFirst: vi.fn(),
  orgMemberCreate: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationFindMany: vi.fn(),
  invitationFindUnique: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdate: vi.fn(),
  invitationUpdateMany: vi.fn(),
  headers: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
  cookies: async () => cookieStore,
}));

vi.mock("@/lib/auth/context", () => ({
  requireOrgContext: mocks.requireOrgContext,
  requireOrgRole: mocks.requireOrgRole,
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

vi.mock("@/services/email", () => ({
  emailService: {
    sendEmail: mocks.sendEmail,
  },
}));

vi.mock("@/services/audit", () => ({
  logAuditEvent: mocks.logAuditEvent,
}));

vi.mock("@/lib/db", () => ({
  default: {
    organization: {
      findUnique: mocks.orgFindUnique,
    },
    organizationMember: {
      findMany: mocks.orgMemberFindMany,
      findFirst: mocks.orgMemberFindFirst,
      create: mocks.orgMemberCreate,
    },
    organizationInvitation: {
      findFirst: mocks.invitationFindFirst,
      findMany: mocks.invitationFindMany,
      findUnique: mocks.invitationFindUnique,
      create: mocks.invitationCreate,
      update: mocks.invitationUpdate,
      updateMany: mocks.invitationUpdateMany,
    },
    $transaction: mocks.transaction,
  },
}));

import { acceptTeamInvitation, inviteTeamMember } from "../team";

describe("team actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        host: "localhost:3000",
      }),
    );
    mocks.requireOrgContext.mockResolvedValue({
      orgId: "org-1",
      membership: { role: "OWNER" },
      user: { id: "user-1", email: "owner@brand.test" },
    });
    mocks.requireUser.mockResolvedValue({
      id: "user-2",
      email: "invitee@brand.test",
    });
    mocks.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        organizationMember: {
          findFirst: mocks.orgMemberFindFirst,
          create: mocks.orgMemberCreate,
        },
        organizationInvitation: {
          update: mocks.invitationUpdate,
        },
      }),
    );
  });

  it("creates and emails an invitation scoped to the current organization", async () => {
    mocks.orgMemberFindFirst.mockResolvedValue(null);
    mocks.invitationFindFirst.mockResolvedValue(null);
    mocks.invitationCreate.mockResolvedValue({
      id: "inv-1",
      token: "x".repeat(48),
    });
    mocks.orgFindUnique.mockResolvedValue({
      name: "Brand Org",
    });

    await inviteTeamMember({
      email: "Invitee@Brand.test",
      role: "ADMIN",
    });

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.requireOrgRole).toHaveBeenCalledWith({ role: "OWNER" }, ["OWNER", "ADMIN"]);
    expect(mocks.invitationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: "org-1",
        email: "invitee@brand.test",
        role: "ADMIN",
        invitedByUserId: "user-1",
        status: "PENDING",
      }),
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "invitee@brand.test",
        subject: expect.stringContaining("Brand Org"),
        html: expect.stringContaining("/invite/"),
      }),
    );
  });

  it("accepts a pending invitation for the matching authenticated email", async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: "inv-1",
      orgId: "org-1",
      email: "invitee@brand.test",
      role: "MEMBER",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      organization: { name: "Brand Org" },
    });
    mocks.orgMemberFindFirst.mockResolvedValue(null);

    const result = await acceptTeamInvitation("x".repeat(48));

    expect(mocks.assertSameOrigin).toHaveBeenCalledTimes(1);
    expect(mocks.orgMemberCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-2",
        orgId: "org-1",
        role: "MEMBER",
      },
    });
    expect(mocks.invitationUpdate).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: {
        status: "ACCEPTED",
        acceptedAt: expect.any(Date),
      },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      "org_id",
      "org-1",
      expect.objectContaining({
        path: "/",
      }),
    );
    expect(result).toEqual({
      success: true,
      organizationName: "Brand Org",
    });
  });
});
