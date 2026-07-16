"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PlanConfig } from "@/config/subscriptions";

import { useFeature } from "./subscription-provider";

export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: keyof PlanConfig["features"];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasAccess = useFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function UpgradeFallback({ message = "Fonctionnalité réservée aux plans supérieurs" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/50 p-4">
      <Lock className="h-4 w-4 text-muted-foreground" />
      <p className="text-center text-muted-foreground text-sm">{message}</p>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link href="/dashboard/billing">Gérer mon abonnement</Link>
      </Button>
    </div>
  );
}
