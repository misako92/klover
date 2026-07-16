"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { z } from "zod";

import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Votre nom est requis.").max(100),
  companyName: z.string().min(2, "Le nom de votre entreprise est requis.").max(200),
  companyType: z.enum(["ecommerce", "marketplace", "both", "retail"]),
  productCount: z.enum(["1-100", "100-1000", "1000-10000", "10000+"]),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(values: OnboardingData) {
  await assertSameOrigin();
  const parsed = onboardingSchema.parse(values);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/v2/login");
  }

  // Prevent double-submit: if user already has an org, redirect
  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    select: { orgId: true },
  });

  if (existingMembership) {
    (await cookies()).set("org_id", existingMembership.orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/dashboard/default");
  }

  if (!user.email) {
    throw new Error("Adresse email requise pour créer un compte.");
  }

  // Update Supabase user metadata with full_name
  await supabase.auth.updateUser({
    data: { full_name: parsed.fullName },
  });

  // Use a transaction with a unique slug to prevent race conditions
  const slug = `org-${user.id.slice(0, 8)}`;
  const org = await prisma.$transaction(async (tx) => {
    // Re-check inside transaction to prevent race condition
    const doubleCheck = await tx.organizationMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    if (doubleCheck) return { id: doubleCheck.orgId, alreadyExisted: true };

    await tx.user.update({
      where: { id: user.id },
      data: { name: parsed.fullName },
    });

    const created = await tx.organization.create({
      data: {
        name: parsed.companyName,
        slug,
        plan: "free",
        subscriptionStatus: "ACTIVE",
      },
    });

    await tx.organizationMember.create({
      data: {
        userId: user.id,
        orgId: created.id,
        role: "OWNER",
      },
    });

    return { id: created.id, alreadyExisted: false };
  });

  (await cookies()).set("org_id", org.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Create Stripe customer (non-blocking, retried in createCheckoutSession if missing)
  if (!org.alreadyExisted) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: parsed.companyName,
        metadata: { orgId: org.id, userId: user.id },
      });
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customer.id },
      });
    } catch {
      // Non-blocking: Stripe customer will be created at checkout time
    }
  }

  redirect("/dashboard/default");
}
