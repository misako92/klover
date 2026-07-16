import "server-only";

import type { SubscriptionState } from "@/components/subscription/subscription-provider";
import { DEFAULT_PLAN, PLANS, type PlanConfig, type SubscriptionPlan } from "@/config/subscriptions";
import { requireOrgContext } from "@/lib/auth/context";
import prisma from "@/lib/db";

/**
 * Récupère le plan d'abonnement actuel de l'organisation depuis la base de données.
 */
export async function getCurrentPlan(): Promise<PlanConfig> {
  try {
    const { orgId } = await requireOrgContext();

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });

    const planId = (org?.plan as SubscriptionPlan) || DEFAULT_PLAN;
    return PLANS[planId] || PLANS[DEFAULT_PLAN];
  } catch {
    // Fallback if no org context (e.g. during initial setup)
    return PLANS[DEFAULT_PLAN];
  }
}

/**
 * Récupère l'état complet de l'abonnement (plan + statut + trial).
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  try {
    const { orgId } = await requireOrgContext();

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true, subscriptionStatus: true, trialEndsAt: true },
    });

    const planId = (org?.plan as SubscriptionPlan) || DEFAULT_PLAN;
    const plan = PLANS[planId] || PLANS[DEFAULT_PLAN];
    const status = org?.subscriptionStatus || "ACTIVE";

    return {
      plan,
      subscriptionStatus: status,
      trialEndsAt: org?.trialEndsAt?.toISOString() ?? null,
      isTrialing: status === "TRIALING",
      isActive: status === "ACTIVE" || status === "TRIALING",
    };
  } catch {
    return {
      plan: PLANS[DEFAULT_PLAN],
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
      isTrialing: false,
      isActive: true,
    };
  }
}

/**
 * Vérifie si le plan actuel a accès à une fonctionnalité spécifique.
 */
export async function hasPermission(feature: keyof PlanConfig["features"]): Promise<boolean | string | number> {
  const plan = await getCurrentPlan();
  return plan.features[feature];
}
