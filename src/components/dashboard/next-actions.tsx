"use client";

import Link from "next/link";

import { ArrowRight, ChevronRight, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

export function NextActions() {
  const { compliance } = useComplianceData();
  const actions = compliance.nextActions;

  return (
    <Card
      id="next-actions"
      className="glass-card border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg"
    >
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg tracking-tight">À traiter maintenant</CardTitle>
          </div>
          <span className="font-medium text-muted-foreground text-xs">{actions.length} action(s)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? (
          <div className="rounded-lg border border-border border-dashed bg-background/70 p-4 text-muted-foreground text-sm">
            Rien de bloquant pour le moment.
          </div>
        ) : (
          <div className="space-y-1">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className={cn(
                  "group hover:-translate-y-0.5 flex items-center gap-3 rounded-xl border border-border/40 bg-white/50 p-3 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm">{action.title}</div>
                  <div className="truncate text-muted-foreground text-xs">{action.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}

        <Button
          asChild
          variant="ghost"
          className="group/link h-8 w-full text-muted-foreground text-xs hover:text-foreground"
        >
          <Link href="/dashboard/activity">
            Voir le détail
            <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
