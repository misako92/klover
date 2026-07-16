"use client";

import Link from "next/link";

import { ArrowRight, BarChart3, Building2, Clock3, Layers, Package, TrendingUp, Weight } from "lucide-react";

import {
  MaterialDistributionChart,
  OrganismDistributionChart,
  PackagingDistributionChart,
  TopContributorsChart,
} from "@/components/dashboard/analytics-charts";
import { FeatureGate, UpgradeFallback } from "@/components/subscription/feature-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

import { ForecastingCard } from "./_components/forecasting-card";

export default function AnalyticsPage() {
  const { ready, db, analytics, kpis } = useComplianceData();

  if (!ready) {
    return <AnalyticsSkeleton />;
  }

  const lastUpdatedLabel = new Date(db.updatedAt).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="stagger-1 container mx-auto max-w-[1600px] animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">Analyse</h1>
          <p className="mt-1 text-muted-foreground">
            Pilotage de votre conformite et lecture des contributions estimees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-white/50 px-3 py-1.5 text-muted-foreground text-xs shadow-sm backdrop-blur-sm md:flex">
            <Clock3 className="size-3.5" />
            <span>Mis a jour : {lastUpdatedLabel}</span>
          </div>
          <Button asChild className="rounded-full bg-emerald-600 px-6 text-white shadow-sm hover:bg-emerald-700">
            <Link href="/dashboard/declarations">
              Voir les declarations <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="stagger-2 grid animate-enter gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tonnage analyse"
          value={`${kpis.totalTonnageKg.toLocaleString("fr-FR")} kg`}
          helper="Poids total des produits classes sur la periode."
          icon={<Weight className="size-5 text-emerald-600" />}
          delay={1}
        />
        <MetricCard
          label="Matieres suivies"
          value={String(analytics.byMaterial.length)}
          helper="Nombre de familles de materiaux identifiees."
          icon={<Layers className="size-5 text-blue-600" />}
          delay={2}
        />
        <MetricCard
          label="Eco-organismes"
          value={String(analytics.byOrganism.length)}
          helper="Partenaires de responsabilite elargie suivis."
          icon={<Building2 className="size-5 text-amber-600" />}
          delay={3}
        />
        <MetricCard
          label="Taux de reemploi"
          value={`${analytics.reusabilityStats?.reusablePercent ?? 0}%`}
          helper={`${analytics.reusabilityStats?.totalReusableItems ?? 0} unites rotatives.`}
          icon={<Package className="size-5 text-indigo-600" />}
          delay={4}
        />
      </div>

      <div className="stagger-3 animate-enter">
        <ForecastingCard />
      </div>

      <FeatureGate
        feature="advancedAnalytics"
        fallback={
          <Card className="glass-card stagger-3 animate-enter border-border border-dashed">
            <CardHeader>
              <CardTitle>Analyses avancees</CardTitle>
              <CardDescription>
                Votre plan actuel fournit les KPI essentiels. La repartition detaillee est disponible avec Growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpgradeFallback message="Debloquez la repartition matiere/organisme et les top contributeurs avec le plan Growth." />
            </CardContent>
          </Card>
        }
      >
        <div className="stagger-3 grid animate-enter gap-6 lg:grid-cols-2">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-border/40 border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="size-5 text-emerald-600" />
                Repartition par matiere
              </CardTitle>
              <CardDescription>Poids estime par famille de materiau.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MaterialDistributionChart />
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-border/40 border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="size-5 text-blue-600" />
                Par organisme
              </CardTitle>
              <CardDescription>Repartition du gisement vers les filieres REP.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <OrganismDistributionChart />
            </CardContent>
          </Card>
        </div>

        <div className="stagger-3 mt-6 animate-enter">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-border/40 border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="size-5 text-indigo-600" />
                Type d'emballage
              </CardTitle>
              <CardDescription>
                Repartition menager vs secondaire / tertiaire prise en compte dans les calculs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PackagingDistributionChart />
            </CardContent>
          </Card>
        </div>
      </FeatureGate>

      <FeatureGate feature="advancedAnalytics">
        <div className="stagger-4 animate-enter">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-border/40 border-b bg-muted/10 pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Top contributeurs</CardTitle>
                  <CardDescription>Les 10 produits ayant le plus d'impact financier estime.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="h-[250px] w-full overflow-hidden rounded-xl">
                <TopContributorsChart />
              </div>
              <div className="dashboard-table-shell">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Matiere</TableHead>
                      <TableHead>Organisme</TableHead>
                      <TableHead className="text-right">Contribution est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topContributors.slice(0, 10).map((item) => (
                      <TableRow key={item.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">{item.sku}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md border border-border/40 bg-muted/50 px-2 py-1 font-medium text-xs">
                            {item.materialType}
                          </span>
                        </TableCell>
                        <TableCell>{item.ecoOrganism}</TableCell>
                        <TableCell className="text-right font-medium text-foreground tabular-nums">
                          {item.contributionEur.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  delay,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <Card
      className={cn(
        "hover-lift glass-card group relative overflow-hidden border-none shadow-sm",
        `animate-delay-${delay * 100}`,
      )}
    >
      <div className="-mr-8 -mt-8 pointer-events-none absolute top-0 right-0 rounded-full bg-gradient-to-br from-emerald-500/5 to-transparent p-16 blur-2xl transition-colors duration-500 group-hover:from-emerald-500/10" />
      <CardHeader className="relative z-10 pb-2">
        <div className="mb-2 flex items-center justify-between">
          <CardDescription className="font-medium text-muted-foreground/80 text-sm uppercase tracking-wide">
            {label}
          </CardDescription>
          <div className="rounded-lg border border-border/50 bg-background/80 p-2 text-foreground shadow-sm ring-1 ring-black/5">
            {icon}
          </div>
        </div>
        <CardTitle className="font-bold text-4xl text-foreground tabular-nums tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-muted-foreground text-xs">{helper}</p>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="container mx-auto max-w-[1600px] space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}
