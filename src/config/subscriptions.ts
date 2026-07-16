export type SubscriptionPlan = "free" | "starter" | "growth" | "enterprise";

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: string;
  features: {
    maxProducts: number;
    canExport: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    support: "community" | "email" | "priority";
    multiOrg: boolean;
    integrations: boolean;
    prioritySupport: boolean;
  };
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: "Gratuit",
    features: {
      maxProducts: 50,
      canExport: false,
      advancedAnalytics: false,
      apiAccess: false,
      support: "community",
      multiOrg: false,
      integrations: false,
      prioritySupport: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: "49€/mois",
    features: {
      maxProducts: 500,
      canExport: true,
      advancedAnalytics: false,
      apiAccess: false,
      support: "email",
      multiOrg: false,
      integrations: false,
      prioritySupport: false,
    },
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: "149€/mois",
    features: {
      maxProducts: 10000,
      canExport: true,
      advancedAnalytics: true,
      apiAccess: false,
      support: "priority",
      multiOrg: false,
      integrations: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Sur devis",
    features: {
      maxProducts: Number.POSITIVE_INFINITY,
      canExport: true,
      advancedAnalytics: true,
      apiAccess: true,
      support: "priority",
      multiOrg: true,
      integrations: true,
      prioritySupport: true,
    },
  },
};

export const DEFAULT_PLAN: SubscriptionPlan = "free";
