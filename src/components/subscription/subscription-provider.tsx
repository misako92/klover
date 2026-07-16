"use client";

import { createContext, useContext } from "react";

import type { PlanConfig } from "@/config/subscriptions";

export interface SubscriptionState {
  plan: PlanConfig;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  isTrialing: boolean;
  isActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

export function SubscriptionProvider({ state, children }: { state: SubscriptionState; children: React.ReactNode }) {
  return <SubscriptionContext.Provider value={state}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptionState() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptionState must be used within SubscriptionProvider");
  }
  return context;
}

/** Shortcut: returns just the PlanConfig (backwards-compatible) */
export function useSubscription() {
  return useSubscriptionState().plan;
}

export function useFeature(feature: keyof PlanConfig["features"]) {
  const { plan } = useSubscriptionState();
  return plan.features[feature];
}
