"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ArrowRight, Loader2, Lock, Sparkles, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/app/actions/subscription";
import type { PlanConfig, SubscriptionPlan } from "@/config/subscriptions";
import { PLANS } from "@/config/subscriptions";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Progress } from "../ui/progress";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanConfig;
  /** Feature qui a declenche le modal */
  reason?: string;
  /** Usage actuel (pour les limites numeriques) */
  currentUsage?: number;
  maxUsage?: number;
}

const PLAN_ICONS: Record<SubscriptionPlan, React.ReactNode> = {
  free: <Lock className="size-5" />,
  starter: <Zap className="size-5" />,
  growth: <TrendingUp className="size-5" />,
  enterprise: <Sparkles className="size-5" />,
};

const PLAN_HIGHLIGHTS: Record<SubscriptionPlan, string[]> = {
  free: [],
  starter: ["500 produits", "Export CSV/Excel", "Support email"],
  growth: ["10 000 produits", "Analytics avances", "Integrations e-commerce", "Support prioritaire"],
  enterprise: ["Produits illimites", "Acces API", "Multi-organisation", "Support dedie"],
};

const PLAN_ORDER: SubscriptionPlan[] = ["free", "starter", "growth", "enterprise"];

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  reason,
  currentUsage,
  maxUsage,
}: UpgradeModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentIndex = PLAN_ORDER.indexOf(currentPlan.id);
  const upgradePlans = PLAN_ORDER.slice(currentIndex + 1)
    .map((id) => PLANS[id])
    .filter((p) => p.id !== "enterprise" || currentPlan.id === "growth");

  const handleUpgrade = (planId: SubscriptionPlan) => {
    if (planId === "enterprise") {
      router.push("/contact");
      onOpenChange(false);
      return;
    }

    if (planId !== "starter" && planId !== "growth") return;

    setLoadingPlan(planId);
    startTransition(async () => {
      try {
        const url = await createCheckoutSession(planId, "monthly");
        window.location.href = url;
      } catch {
        toast.error("Impossible de lancer le paiement. Réessayez ou contactez le support.");
        setLoadingPlan(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl">Passez au niveau superieur</DialogTitle>
            <DialogDescription>
              {reason || "Debloquez plus de fonctionnalites pour votre entreprise."}
            </DialogDescription>
          </DialogHeader>

          {/* Barre d'usage si applicable */}
          {currentUsage !== undefined && maxUsage !== undefined && Number.isFinite(maxUsage) && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilisation actuelle</span>
                <span className="font-semibold">
                  {currentUsage} / {maxUsage}
                </span>
              </div>
              <Progress value={Math.min((currentUsage / maxUsage) * 100, 100)} className="h-2" />
            </div>
          )}
        </div>

        {/* Plans disponibles */}
        <div className="space-y-3 p-6">
          {upgradePlans.map((plan) => {
            const isLoading = isPending && loadingPlan === plan.id;
            const highlights = PLAN_HIGHLIGHTS[plan.id];

            return (
              <div
                key={plan.id}
                className="group relative rounded-xl border border-border/60 p-4 transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        {PLAN_ICONS[plan.id]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <Badge variant="secondary" className="mt-0.5 text-xs">
                          {plan.price}
                        </Badge>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-muted-foreground text-sm">
                          <ArrowRight className="size-3 text-emerald-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isPending}
                    className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : plan.id === "enterprise" ? (
                      "Contacter"
                    ) : (
                      "Choisir"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <p className="text-center text-muted-foreground text-xs">
            Changement de plan instantane. Annulable a tout moment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
