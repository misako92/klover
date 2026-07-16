"use client";

import { useEffect } from "react";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const TOUR_STORAGE_KEY = "has_seen_dashboard_tour";

function buildTourSteps() {
  const candidates = [
    {
      element: "#workflow-journey",
      popover: {
        title: "Parcours du mois",
        description: "Commencez ici pour savoir s'il faut importer, vérifier le catalogue ou ouvrir la déclaration.",
        side: "left" as const,
      },
    },
    {
      element: "#quick-actions",
      popover: {
        title: "Actions rapides",
        description: "Accès direct aux pages les plus utiles quand vous savez déjà quoi faire.",
        side: "bottom" as const,
      },
    },
    {
      element: "#alert-center",
      popover: {
        title: "Alertes de conformité",
        description: "Les points bloquants ou prioritaires remontent ici en premier.",
        side: "left" as const,
      },
    },
    {
      element: "#next-actions",
      popover: {
        title: "Suite recommandée",
        description: "Cette liste vous renvoie vers la prochaine action concrète à traiter.",
        side: "left" as const,
      },
    },
  ];

  return candidates.filter((step) => document.querySelector(step.element));
}

export function DashboardTour() {
  const startTour = () => {
    const steps = buildTourSteps();
    if (steps.length === 0) {
      return;
    }

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      steps,
    });

    driverObj.drive();
  };

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (hasSeenTour) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTour();
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [startTour]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTour}
      className="hidden gap-2 text-muted-foreground hover:text-emerald-600 md:flex"
    >
      <HelpCircle className="size-4" />
      Visite guidée
    </Button>
  );
}
