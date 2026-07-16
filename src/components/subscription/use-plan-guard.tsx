"use client";

import { useCallback, useState } from "react";

import { toast } from "sonner";

import type { PlanConfig } from "@/config/subscriptions";

import { useSubscriptionState } from "./subscription-provider";
import { UpgradeModal } from "./upgrade-modal";

interface PlanGuardState {
  reason: string;
  currentUsage?: number;
  maxUsage?: number;
}

/**
 * Hook qui fournit un guard cote client pour les features payantes.
 *
 * Retourne:
 * - `guard(feature, label)` — verifie la feature, ouvre le modal si bloquee, retourne true si autorise
 * - `guardProductLimit(current)` — verifie la limite produits, affiche warning a 80%
 * - `UpgradeModalRenderer` — composant a monter dans le JSX
 */
export function usePlanGuard() {
  const { plan } = useSubscriptionState();
  const [modalState, setModalState] = useState<PlanGuardState | null>(null);

  const guard = useCallback(
    (feature: keyof PlanConfig["features"], label: string): boolean => {
      const value = plan.features[feature];
      if (value) return true;

      setModalState({
        reason: `${label} n'est pas disponible sur le plan ${plan.name}.`,
      });
      return false;
    },
    [plan],
  );

  const guardProductLimit = useCallback(
    (currentCount: number): boolean => {
      const max = plan.features.maxProducts;

      // Pas de limite
      if (!Number.isFinite(max)) return true;

      // Limite atteinte
      if (currentCount >= max) {
        setModalState({
          reason: `Vous avez atteint la limite de ${max} produits sur le plan ${plan.name}.`,
          currentUsage: currentCount,
          maxUsage: max,
        });
        return false;
      }

      // Warning a 80%
      const usage = (currentCount / max) * 100;
      if (usage >= 80) {
        toast.warning(`Attention : ${currentCount}/${max} produits utilises (${Math.round(usage)}%)`, {
          description: `Vous approchez de la limite du plan ${plan.name}.`,
          duration: 6000,
        });
      }

      return true;
    },
    [plan],
  );

  const UpgradeModalRenderer = useCallback(
    () =>
      modalState ? (
        <UpgradeModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setModalState(null);
          }}
          currentPlan={plan}
          reason={modalState.reason}
          currentUsage={modalState.currentUsage}
          maxUsage={modalState.maxUsage}
        />
      ) : null,
    [modalState, plan],
  );

  return { guard, guardProductLimit, UpgradeModalRenderer };
}
