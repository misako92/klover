"use server";

import { cookies } from "next/headers";

import { z } from "zod";

import { assertOrgAccess, requireUser } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";

const orgIdSchema = z.string().min(1);

export async function getUserOrganizations() {
  const user = await requireUser();

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));
}

export async function setCurrentOrganization(rawOrgId: string) {
  await assertSameOrigin();
  const orgId = orgIdSchema.parse(rawOrgId);
  await assertOrgAccess(orgId);

  (await cookies()).set("org_id", orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { success: true, orgId };
}
