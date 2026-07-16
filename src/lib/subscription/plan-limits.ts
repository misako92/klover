import "server-only";

import type { PlanConfig, SubscriptionPlan } from "@/config/subscriptions";
import { PLANS } from "@/config/subscriptions";
import { requireOrgContext } from "@/lib/auth/context";
import prisma from "@/lib/db";

import { getCurrentPlan } from "./current-plan";

export interface PlanLimitResult {
  allowed: boolean;
  current: number;
  max: number;
  /** Pourcentage d'utilisation (0-100) */
  usage: number;
  plan: PlanConfig;
  /** Le prochain plan qui augmente cette limite, ou null si enterprise */
  nextPlan: PlanConfig | null;
}

const PLAN_ORDER: SubscriptionPlan[] = ["free", "starter", "growth", "enterprise"];

/**
 * Trouve le prochain plan qui offre une meilleure limite pour maxProducts
 * ou qui active une feature boolean.
 */
function getNextUpgradePlan(currentPlan: PlanConfig): PlanConfig | null {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan.id);
  if (currentIndex === -1 || currentIndex >= PLAN_ORDER.length - 1) return null;
  return PLANS[PLAN_ORDER[currentIndex + 1]];
}

/**
 * Verifie la limite de produits pour l'organisation courante.
 */
export async function checkProductLimit(): Promise<PlanLimitResult> {
  const { orgId } = await requireOrgContext();
  const plan = await getCurrentPlan();
  const count = await prisma.product.count({ where: { orgId } });
  const max = plan.features.maxProducts;
  const usage = Number.isFinite(max) ? Math.round((count / max) * 100) : 0;

  return {
    allowed: !Number.isFinite(max) || count < max,
    current: count,
    max,
    usage,
    plan,
    nextPlan: getNextUpgradePlan(plan),
  };
}

/**
 * Verifie si une feature boolean est autorisee sur le plan courant.
 * Retourne le plan courant et le prochain plan disponible.
 */
export async function checkFeatureAccess(
  feature: keyof PlanConfig["features"],
): Promise<{ allowed: boolean; plan: PlanConfig; nextPlan: PlanConfig | null }> {
  const plan = await getCurrentPlan();
  const value = plan.features[feature];

  return {
    allowed: Boolean(value),
    plan,
    nextPlan: getNextUpgradePlan(plan),
  };
}

/**
 * Verifie la limite produits et lance une erreur si depassee.
 * A utiliser dans les server actions avant creation de produits.
 */
export async function enforceProductLimit(): Promise<void> {
  const result = await checkProductLimit();
  if (!result.allowed) {
    const nextPlanName = result.nextPlan?.name ?? "superieur";
    throw new Error(
      `Limite de ${result.max} produits atteinte sur le plan ${result.plan.name}. Passez au plan ${nextPlanName} pour continuer.`,
    );
  }
}

/**
 * Verifie l'acces a une feature et lance une erreur si non autorisee.
 */
export async function enforceFeatureAccess(feature: keyof PlanConfig["features"], label: string): Promise<void> {
  const result = await checkFeatureAccess(feature);
  if (!result.allowed) {
    const nextPlanName = result.nextPlan?.name ?? "superieur";
    throw new Error(`${label} n'est pas disponible sur le plan ${result.plan.name}. Passez au plan ${nextPlanName}.`);
  }
}
