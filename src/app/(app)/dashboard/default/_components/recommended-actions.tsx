"use client";

import { useState } from "react";

import Link from "next/link";

import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Package, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: Date | string;
}

interface RecommendedActionsProps {
  alerts?: Alert[];
}

const actionConfig: Record<string, { icon: typeof Package; href: string; color: string }> = {
  UNCLASSIFIED_PRODUCTS: {
    icon: Package,
    href: "/dashboard/products",
    color: "text-amber-600",
  },
  DECLARATION_DUE: {
    icon: FileText,
    href: "/dashboard/declarations",
    color: "text-red-600",
  },
  IMPORT_COMPLETED: {
    icon: UploadCloud,
    href: "/dashboard/orders",
    color: "text-blue-600",
  },
};

const severityColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export function RecommendedActions({ alerts }: RecommendedActionsProps) {
  const [dismissed, _setDismissed] = useState<Set<string>>(new Set());

  // Default mock alerts if none provided
  const defaultAlerts: Alert[] = [
    {
      id: "action-1",
      type: "UNCLASSIFIED_PRODUCTS",
      title: "12 produits à classifier",
      message: "Classifiez vos produits pour calculer les éco-contributions.",
      severity: "WARNING",
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: "action-2",
      type: "DECLARATION_DUE",
      title: "Déclaration CITEO T1 2026",
      message: "Date limite : 31 mars 2026",
      severity: "CRITICAL",
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: "action-3",
      type: "IMPORT_COMPLETED",
      title: "Importer vos ventes récentes",
      message: "Gardez vos données à jour pour un suivi précis.",
      severity: "INFO",
      isRead: false,
      createdAt: new Date(),
    },
  ];

  const activeAlerts = (alerts || defaultAlerts).filter((a) => !dismissed.has(a.id) && !a.isRead);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-base">Actions recommandées</CardTitle>
          {activeAlerts.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs tabular-nums">
              {activeAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto pt-1">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-3 size-10 text-emerald-400" />
            <p className="font-medium text-foreground text-sm">Tout est à jour !</p>
            <p className="mt-1 text-muted-foreground text-xs">Aucune action urgente pour le moment.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const config = actionConfig[alert.type] || {
              icon: AlertTriangle,
              href: "/dashboard",
              color: "text-gray-600",
            };
            const Icon = config.icon;

            return (
              <Link
                key={alert.id}
                href={config.href}
                className="group flex items-start gap-3 rounded-lg bg-muted/40 p-3 transition-colors hover:bg-muted"
              >
                <div className={`mt-0.5 shrink-0 ${config.color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm leading-tight">{alert.title}</p>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 px-1.5 py-0 text-[10px] leading-4 ${severityColors[alert.severity] || ""}`}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-snug">{alert.message}</p>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
