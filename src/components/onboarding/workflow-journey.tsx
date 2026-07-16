"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { ArrowRight, CheckCircle2, CircleDot, Clock3 } from "lucide-react";

import {
  buildWorkflowSteps,
  getPrimaryWorkflowAction,
  getWorkflowCompletionPercent,
} from "@/components/onboarding/workflow-journey.helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

function stepIcon(state: "complete" | "current" | "upcoming") {
  if (state === "complete") {
    return <CheckCircle2 className="size-5 text-emerald-500" />;
  }
  if (state === "current") {
    return (
      <div className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        <CircleDot className="relative z-10 size-5 rounded-full bg-white text-blue-600" />
      </div>
    );
  }
  return <Clock3 className="size-5 text-slate-300" />;
}

function stepLabel(state: "complete" | "current" | "upcoming") {
  if (state === "complete") {
    return "Terminé";
  }
  if (state === "current") {
    return "Maintenant";
  }
  return "Ensuite";
}

interface WorkflowJourneyProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
}

export function WorkflowJourney({
  title = "Parcours recommandé",
  description = "Suivez le flux import > vérification > déclaration sans perdre l'étape suivante.",
  headerAction,
}: WorkflowJourneyProps) {
  const { compliance, imports, declarations } = useComplianceData();
  const steps = buildWorkflowSteps(compliance, imports, declarations);
  const primaryAction = getPrimaryWorkflowAction(steps);
  const completionPercent = getWorkflowCompletionPercent(steps);

  return (
    <Card
      id="workflow-journey"
      className="glass-card overflow-hidden border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg"
    >
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-slate-800 text-xl tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between font-medium text-slate-600 text-sm">
            <span>Avancement du mois</span>
            <span className="text-emerald-600">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2.5 bg-slate-100" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* TIMELINE */}
        <div className="before:-translate-x-px relative ml-2 space-y-6 before:absolute before:inset-0 before:ml-[15px] before:w-0.5 before:bg-gradient-to-b before:from-emerald-200 before:via-blue-200 before:to-transparent">
          {steps.map((step, index) => (
            <div key={step.id} className="group relative flex items-start gap-6">
              {/* Icon Container (overlaps the line) */}
              <div className="relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
                {stepIcon(step.state)}
              </div>

              {/* Content Box */}
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-2xl border p-4 transition-all duration-300",
                  step.state === "complete" && "border-emerald-100 bg-emerald-50/30",
                  step.state === "current" &&
                    "-translate-y-1 border-blue-200 bg-blue-50/50 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)]",
                  step.state === "upcoming" && "border-transparent bg-slate-50/50",
                )}
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div
                    className={cn(
                      "font-semibold text-sm",
                      step.state === "current" ? "text-blue-900" : "text-slate-700",
                    )}
                  >
                    {index + 1}. {step.title}
                  </div>
                  <span
                    className={cn(
                      "font-bold text-[10px] uppercase tracking-wider",
                      step.state === "complete"
                        ? "text-emerald-600"
                        : step.state === "current"
                          ? "text-blue-600"
                          : "text-slate-400",
                    )}
                  >
                    {stepLabel(step.state)}
                  </span>
                </div>
                <p className="mt-1 text-slate-500 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* PRIMARY CALL TO ACTION */}
        <div className="group relative mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 transition-all duration-300 hover:border-emerald-300 hover:shadow-soft-lg">
          <div className="-right-10 -top-10 absolute h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl transition-all duration-500 group-hover:bg-emerald-400/30" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-base text-emerald-950">{primaryAction.label}</div>
              <p className="font-medium text-emerald-800/80 text-sm">{primaryAction.description}</p>
            </div>
            <Button
              asChild
              className="hover:-translate-y-0.5 gap-2 bg-emerald-600 text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
            >
              <Link href={primaryAction.href}>
                Ouvrir
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
