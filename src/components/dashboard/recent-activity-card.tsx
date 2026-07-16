"use client";

import * as React from "react";

import Link from "next/link";

import { ArrowRight, CheckCircle2, Clock3, FileSpreadsheet, FileText, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  timestamp: string;
  type: "import" | "declaration";
  status: "success" | "warning" | "draft";
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recent";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "À l'instant";
  }

  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Il y a ${diffDays} j`;
  }

  return date.toLocaleDateString("fr-FR");
}

export function RecentActivityCard() {
  const { declarations, imports } = useComplianceData();

  const items = React.useMemo<ActivityItem[]>(() => {
    const importItems: ActivityItem[] = imports.map((item) => ({
      id: `import-${item.id}`,
      href: "/dashboard/orders",
      title: item.status === "COMPLETED" ? "Import traite" : "Import à corriger",
      description: `${item.fileName} - ${item.rowCount.toLocaleString("fr-FR")} lignes`,
      timestamp: item.importedAt,
      type: "import",
      status: item.status === "COMPLETED" ? "success" : "warning",
    }));

    const declarationItems: ActivityItem[] = declarations.map((item) => ({
      id: `declaration-${item.id}`,
      href: "/dashboard/declarations",
      title: item.status === "SUBMITTED" ? "Declaration soumise" : "Brouillon disponible",
      description: `${item.period} - ${item.ecoOrganism} - ${item.estimatedAmountEur.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}`,
      timestamp: item.submittedAt ?? item.generatedAt,
      type: "declaration",
      status: item.status === "SUBMITTED" ? "success" : "draft",
    }));

    return [...importItems, ...declarationItems]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 5);
  }, [declarations, imports]);

  return (
    <Card className="glass-card border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <CardHeader className="space-y-1">
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>Les derniers imports et mouvements déclaratifs utiles pour garder le fil.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border border-dashed bg-background/60 p-6 text-muted-foreground text-sm">
            Aucune activité récente pour le moment.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group hover:-translate-y-1 relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/40 bg-white/50 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm sm:flex-row"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
                  item.status === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  item.status === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
                  item.status === "draft" && "border-blue-200 bg-blue-50 text-blue-700",
                )}
              >
                {item.type === "import" ? (
                  item.status === "warning" ? (
                    <TriangleAlert className="size-4" />
                  ) : (
                    <FileSpreadsheet className="size-4" />
                  )
                ) : item.status === "success" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground text-sm">{item.title}</div>
                    <div className="truncate text-muted-foreground text-xs">{item.description}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                    <Clock3 className="size-3" />
                    <span>{formatRelativeDate(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}

        <Button asChild variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/activity">
            Ouvrir le centre d'activité
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
