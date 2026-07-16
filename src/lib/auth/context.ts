import "server-only";
import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { OrganizationMember } from "@prisma/client";

import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const ORG_COOKIE = "org_id";

/**
 * Gets the current authenticated user from Supabase.
 * Returns null if not signed in.
 */
export const getCurrentUser = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * Ensures a user is authenticated. Redirects to login if not.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/v2/login");
  }
  return user;
}

/**
 * Gets the current active organization context.
 * Reads from cookie preference, falls back to user's first organization.
 */
export const getCurrentOrgId = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ORG_COOKIE)?.value;
  if (preferredOrgId) {
    const preferred = await prisma.organizationMember.findFirst({
      where: { userId: user.id, orgId: preferredOrgId },
      select: { orgId: true },
    });
    if (preferred?.orgId) return preferred.orgId;
  }

  // Fallback: Get the first organization for the user (stable order)
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    select: { orgId: true },
    orderBy: { createdAt: "asc" },
  });

  return membership?.orgId || null;
});

/**
 * Requires an Organization Context.
 * If user has no org, redirect to onboarding.
 */
export async function requireOrgContext() {
  const user = await requireUser();
  const orgId = await getCurrentOrgId();

  if (!orgId) {
    redirect("/onboarding");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, orgId },
  });
  if (!membership) {
    throw new Error("Unauthorized Access to Organization");
  }

  try {
    const cookieStore = await cookies();
    const current = cookieStore.get(ORG_COOKIE)?.value;
    if (current !== orgId) {
      cookieStore.set(ORG_COOKIE, orgId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch {
    // ignore if called from a Server Component
  }

  return { user, orgId, membership };
}

/**
 * Validates that the current user has access to the specified Org ID.
 */
export async function assertOrgAccess(orgId: string) {
  const user = await requireUser();

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      orgId: orgId,
    },
  });

  if (!membership) {
    throw new Error("Unauthorized Access to Organization");
  }

  return { user, membership };
}

export function requireOrgRole(membership: OrganizationMember, allowed: Array<OrganizationMember["role"]>) {
  if (!allowed.includes(membership.role)) {
    throw new Error("Forbidden");
  }
}
