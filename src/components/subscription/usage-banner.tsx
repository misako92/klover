"use client";

import Link from "next/link";
import { useState } from "react";

import { AlertTriangle, ArrowRight, X } from "lucide-react";

import { PLANS } from "@/config/subscriptions";

import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useSubscriptionState } from "./subscription-provider";
import { UpgradeModal } from "./upgrade-modal";

interface UsageBannerProps {
  currentCount: number;
}

const PLAN_ORDER = ["free", "starter", "growth", "enterprise"] as const;

export function UsageBanner({ currentCount }: UsageBannerProps) {
  const { plan } = useSubscriptionState();
  const max = plan.features.maxProducts;
  const [dismissed, setDismissed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!Number.isFinite(max)) return null;

  const usage = Math.round((currentCount / max) * 100);

  // Ne rien afficher sous 70%
  if (usage < 70 || dismissed) return null;

  const isWarning = usage >= 80 && usage < 100;
  const isCritical = usage >= 100;

  const currentIndex = PLAN_ORDER.indexOf(plan.id);
  const nextPlan = currentIndex < PLAN_ORDER.length - 1 ? PLANS[PLAN_ORDER[currentIndex + 1]] : null;

  return (
    <>
      <div
        className={`relative flex items-center gap-4 rounded-lg border px-4 py-3 ${
          isCritical
            ? "border-red-200 bg-red-50 text-red-900"
            : isWarning
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-blue-200 bg-blue-50 text-blue-900"
        }`}
      >
        <AlertTriangle className={`size-5 shrink-0 ${isCritical ? "text-red-500" : "text-amber-500"}`} />

        <div className="flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {isCritical
                ? `Limite atteinte — ${currentCount}/${max} produits`
                : `${currentCount}/${max} produits utilises (${usage}%)`}
            </span>
            {nextPlan && (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="flex items-center gap-1 font-semibold text-xs underline-offset-2 hover:underline"
              >
                Passer au {nextPlan.name}
                <ArrowRight className="size-3" />
              </button>
            )}
          </div>
          <Progress
            value={Math.min(usage, 100)}
            className={`h-1.5 ${isCritical ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"}`}
          />
        </div>

        {!isCritical && (
          <Button
            variant="ghost"
            size="sm"
            className="size-6 shrink-0 p-0"
            onClick={() => setDismissed(true)}
            aria-label="Fermer"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={plan}
        reason={
          isCritical
            ? `Vous avez atteint la limite de ${max} produits sur le plan ${plan.name}.`
            : `Vous utilisez ${usage}% de votre quota produits.`
        }
        currentUsage={currentCount}
        maxUsage={max}
      />
    </>
  );
}
