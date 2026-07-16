"use client";

import * as React from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

type ActivityFilter = "all" | "alerts" | "operations";

type ActivityEvent = {
  id: string;
  href: string;
  title: string;
  description: string;
  timestamp: string;
  category: "alert" | "import" | "declaration";
  severity: "high" | "medium" | "low" | "success" | "draft" | "failed";
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recent";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "A l'instant";
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

function getEventIcon(event: ActivityEvent) {
  if (event.category === "alert") {
    return event.severity === "high" ? AlertTriangle : ShieldCheck;
  }

  if (event.category === "import") {
    return event.severity === "failed" ? TriangleAlert : FileSpreadsheet;
  }

  return event.severity === "success" ? CheckCircle2 : FileText;
}

function getEventClasses(event: ActivityEvent) {
  if (event.category === "alert") {
    return event.severity === "high"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (event.category === "import") {
    return event.severity === "failed"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return event.severity === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-blue-200 bg-blue-50 text-blue-700";
}

export function ActivityCenterPage() {
  const { compliance, declarations, imports, ready } = useComplianceData();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<ActivityFilter>("all");

  const activityEvents = React.useMemo<ActivityEvent[]>(() => {
    const alertEvents: ActivityEvent[] = compliance.alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      href: alert.href,
      title: alert.label,
      description: alert.description,
      timestamp: new Date().toISOString(),
      category: "alert",
      severity: alert.severity,
    }));

    const importEvents: ActivityEvent[] = imports.map((item) => ({
      id: `import-${item.id}`,
      href: "/dashboard/orders",
      title: item.status === "COMPLETED" ? "Import termine" : "Import a corriger",
      description: `${item.fileName} - ${item.rowCount.toLocaleString("fr-FR")} lignes`,
      timestamp: item.importedAt,
      category: "import",
      severity: item.status === "COMPLETED" ? "success" : "failed",
    }));

    const declarationEvents: ActivityEvent[] = declarations.map((item) => ({
      id: `declaration-${item.id}`,
      href: "/dashboard/declarations",
      title: item.status === "SUBMITTED" ? "Declaration soumise" : "Brouillon disponible",
      description: `${item.period} - ${item.ecoOrganism} - ${item.estimatedAmountEur.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })}`,
      timestamp: item.submittedAt ?? item.generatedAt,
      category: "declaration",
      severity: item.status === "SUBMITTED" ? "success" : "draft",
    }));

    return [...alertEvents, ...importEvents, ...declarationEvents].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
  }, [compliance.alerts, declarations, imports]);

  const filteredEvents = React.useMemo(() => {
    return activityEvents.filter((event) => {
      if (filter === "alerts" && event.category !== "alert") {
        return false;
      }

      if (filter === "operations" && event.category === "alert") {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      );
    });
  }, [activityEvents, filter, search]);

  const submittedCount = declarations.filter((item) => item.status === "SUBMITTED").length;
  const draftCount = declarations.filter((item) => item.status === "DRAFT").length;
  const failedImportsCount = imports.filter((item) => item.status === "FAILED").length;
  const latestOperation = activityEvents.find((event) => event.category !== "alert") ?? null;

  if (!ready) {
    return null;
  }

  return (
    <div className="stagger-1 container mx-auto max-w-6xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 text-xs">
            <ShieldCheck className="size-3.5" />
            Centre d'activite
          </div>
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">Activite</h1>
            <p className="max-w-2xl text-muted-foreground">
              Retrouvez au meme endroit les actions prioritaires, les blocages a lever et l'historique utile des imports
              et declarations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 text-xs">
            {compliance.alerts.length} blocage(s)
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 text-xs">
            {compliance.nextActions.length} action(s)
          </Badge>
          <Badge variant="outline" className="border-border/60 bg-white/70 px-3 py-1 text-foreground text-xs">
            {activityEvents.length} evenement(s)
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="glass-card border-border/60 shadow-md">
            <CardHeader>
              <CardTitle>Actions prioritaires</CardTitle>
              <CardDescription>
                Les prochaines etapes recommandees pour maintenir le cycle import, revue et declaration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {compliance.nextActions.length === 0 ? (
                <div className="rounded-2xl border border-border border-dashed bg-background/70 p-6 text-muted-foreground text-sm">
                  Rien de bloquant pour le moment. Le cycle mensuel est sous controle.
                </div>
              ) : (
                compliance.nextActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-background/80 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20"
                  >
                    <div className="mt-0.5 rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{action.title}</div>
                      <div className="text-muted-foreground text-sm">{action.description}</div>
                    </div>
                    <ArrowRight className="mt-1 size-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 shadow-md">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Historique des operations</CardTitle>
                  <CardDescription>
                    Recherche rapide dans les alertes, imports et declarations traces dans l'application.
                  </CardDescription>
                </div>
                <div className="relative w-full lg:max-w-sm">
                  <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une operation"
                    className="border-border/60 bg-white/70 pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                  Tout
                </FilterChip>
                <FilterChip active={filter === "alerts"} onClick={() => setFilter("alerts")}>
                  Blocages
                </FilterChip>
                <FilterChip active={filter === "operations"} onClick={() => setFilter("operations")}>
                  Operations
                </FilterChip>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-border border-dashed bg-background/70 p-6 text-muted-foreground text-sm">
                  Aucun evenement ne correspond aux filtres appliques.
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const Icon = getEventIcon(event);

                  return (
                    <Link
                      key={event.id}
                      href={event.href}
                      className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-background/80 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20"
                    >
                      <div className={cn("mt-0.5 rounded-full border p-2", getEventClasses(event))}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{event.title}</div>
                            <div className="text-muted-foreground text-sm">{event.description}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                            <Clock3 className="size-3" />
                            <span>{formatRelativeDate(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-border/60 shadow-md">
            <CardHeader>
              <CardTitle>Blocages en cours</CardTitle>
              <CardDescription>Les points a lever avant la prochaine soumission ou le prochain import.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {compliance.alerts.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 text-sm">
                  Aucun blocage critique detecte actuellement.
                </div>
              ) : (
                compliance.alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={alert.href}
                    className={cn(
                      "block rounded-2xl border p-4 transition-colors",
                      alert.severity === "high"
                        ? "border-red-200 bg-red-50/70 hover:bg-red-50"
                        : alert.severity === "medium"
                          ? "border-amber-200 bg-amber-50/70 hover:bg-amber-50"
                          : "border-blue-200 bg-blue-50/70 hover:bg-blue-50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {alert.severity === "high" ? (
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-700" />
                      ) : (
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-700" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{alert.label}</div>
                        <div className="text-muted-foreground text-sm">{alert.description}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 shadow-md">
            <CardHeader>
              <CardTitle>Resume operationnel</CardTitle>
              <CardDescription>Quelques points de controle utiles sans quitter la page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryItem
                label="Declarations soumises"
                value={submittedCount.toString()}
                description={draftCount > 0 ? `${draftCount} brouillon(s) encore ouverts` : "Aucun brouillon ouvert"}
              />
              <SummaryItem
                label="Imports en erreur"
                value={failedImportsCount.toString()}
                description={
                  failedImportsCount > 0 ? "Des imports demandent une correction manuelle" : "Aucun import en erreur"
                }
              />
              <SummaryItem
                label="Derniere operation"
                value={latestOperation ? latestOperation.title : "Aucune"}
                description={
                  latestOperation ? formatRelativeDate(latestOperation.timestamp) : "Pas encore d'historique"
                }
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 shadow-md">
            <CardHeader>
              <CardTitle>Acces rapides</CardTitle>
              <CardDescription>Raccourcis utiles pour traiter un blocage sans revenir au cockpit.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <QuickLink href="/dashboard/orders" label="Ouvrir les imports" />
              <QuickLink href="/dashboard/products?tab=review" label="Verifier le catalogue" />
              <QuickLink href="/dashboard/declarations" label="Revoir les declarations" />
              <QuickLink href="/dashboard/settings" label="Ouvrir les parametres" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border/60 bg-white/70 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SummaryItem({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-2 font-semibold text-foreground text-lg">{value}</div>
      <div className="mt-1 text-muted-foreground text-sm">{description}</div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" className="justify-between bg-white/70">
      <Link href={href}>
        {label}
        <ArrowRight className="size-4" />
      </Link>
    </Button>
  );
}
