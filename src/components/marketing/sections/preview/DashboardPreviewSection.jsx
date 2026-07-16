"use client";

import Link from "next/link";

import { ArrowRight, BarChart3, CheckCircle2, FileText, ShieldAlert } from "lucide-react";

import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { DashboardMockup } from "@/components/marketing/sections/preview/DashboardMockup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardPreviewSection({
  id = "apercu",
  eyebrow = "Votre cockpit conformité",
  title = "Un tableau de bord pensé pour l'action",
  subtitle = "Ne vous noyez plus dans les données. Klover simplifie chaque métrique pour vous aider à comprendre votre conformité REP en un coup d'œil.",
  className = undefined,
}) {
  return (
    <SectionWrapper id={id} className={cn("overflow-hidden", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left Content Area */}
          <div className="max-w-xl">
            {eyebrow && <p className="mb-4 font-bold text-emerald-700 text-xs uppercase tracking-widest">{eyebrow}</p>}
            <h2 className="font-bold font-display text-4xl text-slate-900 leading-[1.15] tracking-tight md:text-5xl">
              {title}
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">{subtitle}</p>

            {/* Smart Feature Pills */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, label: "Statut direct", color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: BarChart3, label: "Suivi tonnage", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: ShieldAlert, label: "Alertes actionnables", color: "text-amber-600", bg: "bg-amber-50" },
                { icon: FileText, label: "Exports validés", color: "text-purple-600", bg: "bg-purple-50" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="hover:-translate-y-1 flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", item.bg)}>
                    <item.icon className={cn("size-4", item.color)} />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full bg-[#0a945b] px-8 font-semibold text-white shadow-[0_8px_16px_rgba(10,148,91,0.25)] transition-all hover:scale-105 hover:bg-[#088250]"
              >
                <Link href="/auth/v2/register">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            {/* Soft decorative background shadow */}
            <div className="-z-10 absolute inset-0 translate-x-8 translate-y-12 rounded-3xl bg-emerald-200/40 blur-3xl" />
            <DashboardMockup />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
