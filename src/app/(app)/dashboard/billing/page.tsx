"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Check, CreditCard, Crown, ExternalLink, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { createCheckoutSession, createPortalSession } from "@/app/actions/subscription";
import { useSubscriptionState } from "@/components/subscription/subscription-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const { plan, isTrialing, trialEndsAt } = useSubscriptionState();
  const { products } = useComplianceData();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const checkoutResult = searchParams.get("checkout");
  const maxProducts = plan.features.maxProducts;
  const usagePercent = Number.isFinite(maxProducts) ? (products.length / maxProducts) * 100 : 5;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  function handleUpgrade(targetPlan: "starter" | "growth") {
    startTransition(async () => {
      try {
        const url = await createCheckoutSession(targetPlan, "monthly");
        window.location.href = url;
      } catch (err) {
        console.error("Checkout error:", err);
      }
    });
  }

  function handleManageSubscription() {
    startTransition(async () => {
      try {
        const url = await createPortalSession();
        window.location.href = url;
      } catch (err) {
        console.error("Portal error:", err);
      }
    });
  }

  return (
    <div className="stagger-1 container mx-auto max-w-5xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Abonnement & Facturation</h1>
        <p className="text-muted-foreground">Gérez votre plan et consultez votre utilisation.</p>
      </div>

      {/* Trial banner */}
      {isTrialing && trialDaysLeft > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          <Sparkles className="size-5 shrink-0" />
          <div className="flex-1">
            <span className="font-medium">Période d'essai en cours</span> — il vous reste{" "}
            <span className="font-bold">
              {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}
            </span>{" "}
            sur votre essai {plan.name}. Après l'essai, votre compte passera au plan Free.
          </div>
        </div>
      )}

      {/* Checkout feedback */}
      {checkoutResult === "success" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
          Paiement confirmé ! Votre plan a été mis à jour.
        </div>
      )}
      {checkoutResult === "cancel" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          Paiement annulé. Vous pouvez réessayer à tout moment.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="glass-card relative overflow-hidden border-emerald-500/20 shadow-md md:col-span-2">
          <div className="-mr-16 -mt-16 pointer-events-none absolute top-0 right-0 rounded-full bg-emerald-500/5 p-32 blur-3xl" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">Plan Actif</CardTitle>
                <CardDescription>
                  {plan.price === "Gratuit" ? "Plan gratuit" : `${plan.price}`}
                  {isTrialing && " (essai)"}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 font-semibold text-sm uppercase tracking-wider",
                  plan.id === "free"
                    ? "border-zinc-200 bg-zinc-50 text-zinc-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                )}
              >
                {plan.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilisation Produits</span>
                <span className="font-medium">
                  {products.length} / {Number.isFinite(maxProducts) ? maxProducts : "Illimité"}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <p className="text-muted-foreground text-xs">
                Vous utilisez {usagePercent.toFixed(0)}% de votre quota produits inclus.
                {usagePercent > 80 && <span className="ml-1 font-medium text-amber-600">Pensez à upgrader !</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <FeatureItem label="Export déclarations" included={plan.features.canExport} />
              <FeatureItem label="Support prioritaire" included={plan.features.prioritySupport} />
              <FeatureItem label="Analytics avancées" included={plan.features.advancedAnalytics} />
              <FeatureItem label="Intégrations e-commerce" included={plan.features.integrations} />
              <FeatureItem label="Accès API" included={plan.features.apiAccess} />
              <FeatureItem label="Multi-organisations" included={plan.features.multiOrg} />
            </div>
          </CardContent>
          <CardFooter className="border-border/40 border-t bg-muted/10 pt-6">
            <div className="flex w-full flex-wrap justify-end gap-3">
              {plan.id === "free" && (
                <>
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    disabled={isPending}
                    onClick={() => handleUpgrade("starter")}
                  >
                    <Zap className="mr-2 size-4" />
                    {isPending ? "Redirection..." : "Passer à Starter — 49€/mois"}
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    disabled={isPending}
                    onClick={() => handleUpgrade("growth")}
                  >
                    <Crown className="mr-2 size-4" />
                    {isPending ? "Redirection..." : "Passer à Growth — 149€/mois"}
                  </Button>
                </>
              )}
              {plan.id === "starter" && (
                <Button
                  className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                  disabled={isPending}
                  onClick={() => handleUpgrade("growth")}
                >
                  <Zap className="mr-2 size-4" />
                  {isPending ? "Redirection..." : "Passer à Growth — 149€/mois"}
                </Button>
              )}
              {(plan.id === "growth" || plan.id === "enterprise") && (
                <Button
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                  onClick={handleManageSubscription}
                >
                  <ExternalLink className="mr-2 size-4" />
                  {isPending ? "Chargement..." : "Gérer mon abonnement"}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Payment Info */}
        <Card className="glass-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Paiement</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="rounded-xl border border-border/60 bg-white/50 p-4">
              <p className="mb-2 font-medium text-foreground text-sm">Facturation sécurisée</p>
              <p className="text-muted-foreground text-sm">
                Les paiements sont gérés par Stripe. Vos données bancaires ne transitent jamais par nos serveurs.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Paiement sécurisé par Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CreditCard className="size-4 text-emerald-600" />
                <span>CB, SEPA, Apple Pay acceptés</span>
              </div>
            </div>

            {plan.id !== "free" && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={isPending}
                onClick={handleManageSubscription}
              >
                <ExternalLink className="mr-2 size-4" />
                {isPending ? "Chargement..." : "Portail Stripe"}
              </Button>
            )}
          </CardContent>

          {plan.id === "free" && (
            <CardFooter className="border-t pt-4">
              <p className="text-center text-muted-foreground text-xs">
                Aucun paiement requis sur le plan Free. Passez à un plan payant quand vous êtes prêt.
              </p>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Plan comparison */}
      {plan.id !== "enterprise" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Comparer les plans</CardTitle>
            <CardDescription>Trouvez le plan adapté à votre activité.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PlanCard
                name="Free"
                price="Gratuit"
                features={["50 produits", "Import CSV", "Classification auto"]}
                isCurrent={plan.id === "free"}
              />
              <PlanCard
                name="Starter"
                price="49€/mois"
                features={["500 produits", "Export PDF", "Support email"]}
                isCurrent={plan.id === "starter"}
                onUpgrade={plan.id === "free" ? () => handleUpgrade("starter") : undefined}
                isPending={isPending}
              />
              <PlanCard
                name="Growth"
                price="149€/mois"
                features={["10 000 produits", "Intégrations", "Support prioritaire"]}
                isCurrent={plan.id === "growth"}
                isPopular
                onUpgrade={plan.id === "free" || plan.id === "starter" ? () => handleUpgrade("growth") : undefined}
                isPending={isPending}
              />
              <PlanCard
                name="Enterprise"
                price="Sur devis"
                features={["Illimité", "API", "Multi-org", "SLA"]}
                isCurrent={false}
                contactHref="/contact"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureItem({ label, included }: { label: string; included: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", included ? "text-foreground" : "text-muted-foreground/60")}>
      <div
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          included ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground",
        )}
      >
        <Check className="size-3" />
      </div>
      <span>{label}</span>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  isPopular,
  onUpgrade,
  isPending,
  contactHref,
}: {
  name: string;
  price: string;
  features: string[];
  isCurrent?: boolean;
  isPopular?: boolean;
  onUpgrade?: () => void;
  isPending?: boolean;
  contactHref?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all",
        isCurrent ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200" : "border-border/60 bg-white/50",
        isPopular && !isCurrent && "border-emerald-200",
      )}
    >
      {isPopular && (
        <Badge className="-top-2.5 -translate-x-1/2 absolute left-1/2 bg-emerald-600 text-[10px] text-white">
          Populaire
        </Badge>
      )}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{name}</span>
          {isCurrent && (
            <Badge variant="outline" className="border-emerald-200 text-[10px] text-emerald-700">
              Actuel
            </Badge>
          )}
        </div>
        <p className="font-bold text-lg">{price}</p>
      </div>
      <ul className="mb-4 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Check className="size-3 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>
      {onUpgrade && !isCurrent && (
        <Button
          size="sm"
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isPending}
          onClick={onUpgrade}
        >
          {isPending ? "..." : "Choisir"}
        </Button>
      )}
      {contactHref && !isCurrent && (
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href={contactHref}>Nous contacter</Link>
        </Button>
      )}
    </div>
  );
}
