"use client";

import { useState } from "react";

import Link from "next/link";

import { AlertCircle, AlertTriangle, ArrowRight, Bell, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

export function AlertCenter() {
  const [isVisible, setIsVisible] = useState(true);
  const { compliance, ready } = useComplianceData();

  if (!isVisible || !ready) return null;

  const { alerts, isIduMissing } = compliance;

  if (alerts.length === 0 && !isIduMissing) {
    return (
      <Card className="glass-card shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="font-semibold text-base text-muted-foreground">Aucun blocage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Aucune alerte critique détectée pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card relative overflow-hidden border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Bell className="h-4 w-4 text-amber-600" />
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          </div>
          <CardTitle className="font-semibold text-amber-950 text-base tracking-tight">Blocages et alertes</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 h-6 w-6 text-amber-800/50 hover:bg-amber-100/50 hover:text-amber-900"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="relative z-10 grid gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`group hover:-translate-y-0.5 flex cursor-pointer items-start gap-4 rounded-xl border p-3.5 transition-all duration-300 hover:shadow-sm ${
              alert.severity === "high"
                ? "border-red-200 bg-red-50/60 hover:border-red-300 hover:bg-red-50"
                : alert.severity === "medium"
                  ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
                  : "border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {alert.severity === "high" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
            ) : alert.severity === "medium" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 text-blue-600" />
            )}

            <div className="flex-1 space-y-1">
              <p
                className={`font-medium text-sm leading-none ${
                  alert.severity === "high"
                    ? "text-red-900"
                    : alert.severity === "medium"
                      ? "text-amber-900"
                      : "text-blue-900"
                }`}
              >
                {alert.label}
              </p>
              <p
                className={`text-xs ${
                  alert.severity === "high"
                    ? "text-red-700/80"
                    : alert.severity === "medium"
                      ? "text-amber-700/80"
                      : "text-blue-700/80"
                }`}
              >
                {alert.description}
              </p>
            </div>
            {alert.href && (
              <Link href={alert.href} className="opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowRight
                  className={`-translate-x-2 size-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${
                    alert.severity === "high"
                      ? "text-red-600"
                      : alert.severity === "medium"
                        ? "text-amber-600"
                        : "text-blue-600"
                  }`}
                />
              </Link>
            )}
          </div>
        ))}

        <Link href="/dashboard/activity">
          <Button
            variant="ghost"
            className="h-auto w-full justify-between py-2 text-muted-foreground text-xs hover:text-foreground"
          >
            Ouvrir le centre d'activité
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
