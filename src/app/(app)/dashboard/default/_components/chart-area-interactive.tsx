"use client";

import Link from "next/link";

import { ArrowRight, PieChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ChartAreaInteractive() {
  return (
    <Card className="group flex h-full flex-col border-transparent bg-background shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
      <CardHeader className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-bold text-base text-foreground tracking-tight">
            <div className="rounded-lg bg-emerald-50 p-1.5 transition-colors group-hover:bg-emerald-100">
              <PieChart className="size-4 text-emerald-600" />
            </div>
            Répartition des contributions
          </CardTitle>
          <Badge
            variant="secondary"
            className="border border-border bg-muted/40 font-medium text-[10px] text-muted-foreground"
          >
            Estimé
          </Badge>
        </div>
        <CardDescription className="mt-0.5 ml-1 font-medium text-muted-foreground text-xs leading-relaxed">
          Majoritairement <span className="font-semibold text-emerald-700">plastique</span> (45%) et{" "}
          <span className="font-semibold text-emerald-700">carton</span> (32%).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 px-5 pt-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-foreground">Plastique</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-[10px] text-emerald-700 text-foreground">
              45%
            </span>
          </div>
          <Progress value={45} className="h-2 bg-muted [&>div]:bg-emerald-600" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground text-sm">Carton / Papier</span>
            <span className="text-[10px] text-muted-foreground">32%</span>
          </div>
          <Progress value={32} className="h-1.5 bg-muted/40 [&>div]:bg-emerald-500/70" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground text-sm">Verre</span>
            <span className="text-[10px] text-muted-foreground">13%</span>
          </div>
          <Progress value={13} className="h-1.5 bg-muted/40 [&>div]:bg-emerald-400/50" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground text-sm">Autres</span>
            <span className="text-[10px] text-muted-foreground">10%</span>
          </div>
          <Progress value={10} className="h-1.5 bg-muted/40 [&>div]:bg-emerald-300/40" />
        </div>
      </CardContent>
      <CardFooter className="mt-auto px-5 pt-2 pb-4">
        <Link href="/dashboard/analytics" prefetch={false} className="w-full">
          <Button
            variant="outline"
            className="h-9 w-full justify-between border-border text-muted-foreground text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 group-hover:border-emerald-200/60"
          >
            Voir l'analyse complète
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
