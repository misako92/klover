import "server-only";

import type { SubscriptionPlan } from "@/config/subscriptions";

/**
 * Maps internal plan IDs to Stripe Price IDs.
 * Set these in your environment variables after creating products in Stripe Dashboard.
 */
export const STRIPE_PRICE_IDS: Record<
  Exclude<SubscriptionPlan, "enterprise" | "free">,
  { monthly: string; annual: string }
> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || "",
  },
};

/**
 * Reverse lookup: Stripe Price ID → internal plan ID.
 */
export function planFromPriceId(priceId: string): SubscriptionPlan | null {
  if (!priceId) return null;
  for (const [plan, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if ((prices.monthly && prices.monthly === priceId) || (prices.annual && prices.annual === priceId)) {
      return plan as SubscriptionPlan;
    }
  }
  return null;
}
