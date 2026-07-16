"use client";

import Link from "next/link";

import { ArrowRight, CheckCircle2, HelpCircle, Info } from "lucide-react";

import { SparkLine } from "@/components/dashboard/spark-line";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string;
  rawValue?: number;
  decimals?: number;
  unit?: string;
  description?: string;
  badge?: {
    label: string;
    variant: "warning" | "success" | "neutral";
  };
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  infoTooltip?: string;
  sparklineData?: { value: number }[];
}

export function MetricCard({
  title,
  value,
  rawValue,
  decimals = 0,
  unit,
  description,
  badge,
  icon,
  action,
  infoTooltip,
  sparklineData,
}: MetricCardProps) {
  return (
    <Card className="glass-card group hover:-translate-y-1 flex flex-col justify-between border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-[0.02] mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-emerald-50/50 via-white/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="-right-10 -top-10 pointer-events-none absolute z-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl transition-transform duration-500 group-hover:scale-150" />

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 font-medium text-slate-500 text-sm">
            {title}
            {infoTooltip ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-slate-400 transition-colors hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent className="border-emerald-100 bg-white text-slate-700 shadow-soft">
                    <p className="max-w-xs text-xs">{infoTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          {icon ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text font-bold text-3xl text-slate-800 text-transparent tabular-nums tracking-tight">
            {rawValue !== undefined ? <CountUp end={rawValue} decimals={decimals} duration={2} separator=" " /> : value}
          </span>
          {unit ? <span className="font-medium text-slate-500 text-sm">{unit}</span> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[2.5rem]">
          {sparklineData ? (
            <div className="mt-2 h-12 w-full">
              <SparkLine data={sparklineData} height={50} />
            </div>
          ) : (
            <>
              {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
              {badge ? (
                <Badge
                  variant="outline"
                  className={`mt-1 gap-1 font-normal ${
                    badge.variant === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : badge.variant === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {badge.variant === "warning" ? <HelpCircle className="h-3 w-3" /> : null}
                  {badge.variant === "success" ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {badge.label}
                </Badge>
              ) : null}
            </>
          )}
        </div>

        {action ? (
          <div className="flex justify-start">
            <Link
              href={action.href}
              className="group flex items-center font-medium text-emerald-600 text-sm hover:text-emerald-700"
            >
              {action.label}
              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
