"use client";

import Link from "next/link";

import { BookOpen, FileInput, FileText, type LucideIcon, Plus } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
}

const actions: QuickAction[] = [
  { label: "Importer un CSV", icon: FileInput, href: "/dashboard/orders" },
  { label: "Créer un brouillon", icon: FileText, href: "/dashboard/declarations" },
  { label: "Ouvrir le catalogue", icon: Plus, href: "/dashboard/products" },
  { label: "Guide import", icon: BookOpen, href: "/dashboard/orders/documentation" },
];

export function QuickActions() {
  return (
    <div id="quick-actions" className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-semibold text-lg text-slate-700 tracking-tight">Accès Rapides</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {actions.map((action, i) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={action.href}
                  className={`group hover:-translate-y-1 glass-card relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border/40 p-5 shadow-soft transition-all duration-300 hover:border-emerald-200 hover:shadow-soft-lg stagger-${i + 1}`}
                >
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/80 to-white/20" />
                  <div className="absolute inset-0 z-0 bg-emerald-500/0 transition-colors duration-500 group-hover:bg-emerald-500/5" />

                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-500/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-emerald-500/30">
                    <action.icon className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div className="relative z-10 text-center">
                    <span className="font-semibold text-slate-700 text-sm transition-colors group-hover:text-emerald-700">
                      {action.label}
                    </span>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-emerald-100 bg-white text-emerald-900 shadow-soft">
                <p>Ouvrir {action.label.toLowerCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
