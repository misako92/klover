"use client";

import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";

import { AlertCenter } from "@/components/dashboard/alert-center";
import { ContributionDistribution } from "@/components/dashboard/contribution-distribution";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NextActions } from "@/components/dashboard/next-actions";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { MetricCard } from "@/components/dashboard/stat-cards";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import { WorkflowJourney } from "@/components/onboarding/workflow-journey";
import { UsageBanner } from "@/components/subscription/usage-banner";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

export default function DashboardPage() {
  const { ready, compliance, kpis, products } = useComplianceData();

  if (!ready) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du tableau de bord...</div>;
  }

  const tonnage = (kpis.totalTonnageKg / 1000).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const classification = Math.round(kpis.classifiedRate);
  const contribution = kpis.estimatedContributionEur.toLocaleString("fr-FR", { style: "decimal" });
  const reviewCount = compliance.needsReviewCount;

  return (
    <div className="dashboard-container space-y-8">
      {/* USAGE BANNER — avertissement si proche de la limite produits */}
      <UsageBanner currentCount={products.length} />

      {/* 1. HEADER ZONE */}
      <div className="stagger-1 flex animate-enter items-end justify-between">
        <DashboardHeader />
        <div className="mb-2 hidden md:block">
          <DashboardTour />
        </div>
      </div>

      {/* 2. HIGH-LEVEL STATUS & QUICK ACCESS */}
      <div className="stagger-2 animate-enter space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            title="Produits à vérifier"
            value={reviewCount.toLocaleString("fr-FR")}
            rawValue={reviewCount}
            decimals={0}
            description={
              reviewCount > 0
                ? "Des références bloquent encore la déclaration du mois."
                : "Aucun produit bloquant pour le moment."
            }
            badge={{
              label: reviewCount > 0 ? "À traiter avant déclaration" : "À jour",
              variant: reviewCount > 0 ? "warning" : "success",
            }}
            icon={<AlertTriangle className="h-4 w-4" />}
            action={{
              label: reviewCount > 0 ? "Ouvrir la review" : "Voir le catalogue",
              href: reviewCount > 0 ? "/dashboard/products?tab=review" : "/dashboard/products",
            }}
          />

          <MetricCard
            title="Catalogue exploitable"
            value={classification.toString()}
            rawValue={kpis.classifiedRate}
            decimals={0}
            unit="%"
            description={`${tonnage} t déjà utilisables dans les calculs`}
            badge={{
              label: `${Math.max(0, 100 - classification)}% encore incomplet`,
              variant: classification === 100 ? "success" : "warning",
            }}
            icon={<CheckCircle2 className="h-4 w-4" />}
            action={{ label: "Compléter le catalogue", href: "/dashboard/products?tab=review" }}
            infoTooltip="Part des produits avec matière, poids et organisme exploitables."
          />

          <MetricCard
            title="Éco-contribution estimée"
            value={contribution}
            rawValue={kpis.estimatedContributionEur}
            decimals={0}
            unit="EUR"
            description={`Barème officiel actif · ${tonnage} t suivies`}
            icon={<FileText className="h-4 w-4" />}
            action={{ label: "Ouvrir les déclarations", href: "/dashboard/declarations" }}
            infoTooltip="Estimation calculée à partir du barème officiel Klover actif pour chaque éco-organisme."
          />
        </div>

        <QuickActions />
      </div>

      {/* 3. MAIN WORKSPACE SPLIT (Actionable | Informative) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* LEFT COLUMN: Focus Actionnel */}
        <div className="stagger-3 animate-enter space-y-6">
          <WorkflowJourney
            title="Prochaine étape"
            description="Votre progression vers la conformité — suivez les étapes une par une."
          />
          <div id="alert-center">
            <AlertCenter />
          </div>
          <NextActions />
        </div>

        {/* RIGHT COLUMN: Focus Informatif & Analytique */}
        <div className="stagger-4 animate-enter space-y-6">
          <ContributionDistribution />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}
