"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { z } from "zod";

import { PLANS, type SubscriptionPlan } from "@/config/subscriptions";
import { requireOrgContext, requireOrgRole } from "@/lib/auth/context";
import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/plans";

const planSchema = z.enum(["free", "starter", "growth", "enterprise"]);

/**
 * Direct plan update (admin/internal use or for "enterprise" custom plan).
 */
export async function updatePlan(rawPlan: string) {
  await assertSameOrigin();
  const plan = planSchema.parse(rawPlan) as SubscriptionPlan;
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER"]);

  await prisma.organization.update({
    where: { id: orgId },
    data: { plan },
  });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");

  return PLANS[plan];
}

/**
 * Creates a Stripe Checkout Session for upgrading to a paid plan.
 * Returns the checkout URL for redirect.
 */
export async function createCheckoutSession(plan: "starter" | "growth", billing: "monthly" | "annual" = "monthly") {
  await assertSameOrigin();
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER"]);

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { stripeCustomerId: true, name: true },
  });

  const priceId = STRIPE_PRICE_IDS[plan]?.[billing];
  if (!priceId) {
    throw new Error("Price non configuré pour ce plan. Contactez le support.");
  }

  // Create or retrieve Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const { user } = await requireOrgContext();
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { orgId },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: orgId },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = (await headers()).get("origin") || "https://klover.co";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=cancel`,
    subscription_data: {
      metadata: { orgId, plan },
    },
    metadata: { orgId, plan },
  });

  if (!session.url) {
    throw new Error("Erreur lors de la création de la session de paiement.");
  }

  return session.url;
}

/**
 * Creates a Stripe Customer Portal session for managing subscription.
 * Returns the portal URL for redirect.
 */
export async function createPortalSession() {
  await assertSameOrigin();
  const { orgId, membership } = await requireOrgContext();
  requireOrgRole(membership, ["OWNER"]);

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { stripeCustomerId: true },
  });

  if (!org.stripeCustomerId) {
    throw new Error("Aucun compte Stripe associé. Veuillez d'abord souscrire à un plan.");
  }

  const origin = (await headers()).get("origin") || "https://klover.co";

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return session.url;
}

/**
 * Get current subscription status from the database (not Stripe API).
 */
export async function getSubscriptionStatus() {
  const { orgId } = await requireOrgContext();

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      plan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
  });

  const plan = PLANS[(org.plan as SubscriptionPlan) || "free"] || PLANS.free;

  return {
    plan,
    subscriptionStatus: org.subscriptionStatus,
    hasStripeSubscription: !!org.stripeSubscriptionId,
    trialEndsAt: org.trialEndsAt,
    isTrialing: org.subscriptionStatus === "TRIALING",
    isActive: org.subscriptionStatus === "ACTIVE" || org.subscriptionStatus === "TRIALING",
  };
}
