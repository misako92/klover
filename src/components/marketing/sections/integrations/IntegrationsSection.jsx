"use client";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShoppingBag,
  Upload,
} from "lucide-react";

import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IntegrationsSection({
  id = "integrations",
  eyebrow = "Écosystème & Intégrations",
  title = "Connectez vos sources e-commerce",
  subtitle = "Import CSV actif immédiatement. Connecteurs Shopify et WooCommerce en cours de déploiement pour synchroniser automatiquement vos ventes.",
  className = undefined,
}) {
  return (
    <SectionWrapper id={id} className={cn("overflow-hidden", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Integration flow illustration */}
          <div className="relative order-2 mx-auto w-full max-w-[500px] lg:order-1 lg:max-w-none">
            {/* Soft decorative background shadow */}
            <div className="-z-10 -translate-x-8 absolute inset-0 translate-y-12 rounded-3xl bg-blue-200/40 blur-3xl" />

            <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-300/40">
              {/* Sources */}
              <p className="mb-3 font-semibold text-[10px] text-slate-400 uppercase tracking-widest">Sources</p>
              <div className="space-y-2.5">
                {[
                  {
                    name: "Import CSV",
                    icon: FileSpreadsheet,
                    status: "Actif",
                    statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
                    iconBg: "bg-emerald-100 text-emerald-600",
                  },
                  {
                    name: "Shopify",
                    icon: ShoppingBag,
                    status: "Bientôt",
                    statusColor: "text-blue-600 bg-blue-50 border-blue-200",
                    iconBg: "bg-blue-100 text-blue-600",
                  },
                  {
                    name: "WooCommerce",
                    icon: ShoppingBag,
                    status: "Bientôt",
                    statusColor: "text-amber-600 bg-amber-50 border-amber-200",
                    iconBg: "bg-amber-100 text-amber-600",
                  },
                ].map((src) => (
                  <div
                    key={src.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-shadow hover:shadow-sm"
                  >
                    <div className={cn("flex size-9 items-center justify-center rounded-lg", src.iconBg)}>
                      <src.icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700 text-sm">{src.name}</p>
                    </div>
                    <span
                      className={cn("rounded-full border px-2.5 py-0.5 font-semibold text-[10px]", src.statusColor)}
                    >
                      {src.status === "Actif" ? (
                        <CheckCircle2 className="mr-1 inline size-3" />
                      ) : (
                        <Clock className="mr-1 inline size-3" />
                      )}
                      {src.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Arrow connector */}
              <div className="flex justify-center py-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-px bg-gradient-to-b from-slate-200 to-emerald-400" />
                  <div className="rounded-full bg-emerald-100 p-1.5">
                    <RefreshCw className="size-3 text-emerald-600" />
                  </div>
                  <div className="h-6 w-px bg-gradient-to-b from-emerald-400 to-slate-200" />
                </div>
              </div>

              {/* Klover */}
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm text-white shadow-sm">
                    K
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-sm">Klover</p>
                    <p className="text-emerald-600 text-xs">Classification automatique + déclarations</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Produits", value: "2 847" },
                    { label: "Classés", value: "94%" },
                    { label: "Contribution", value: "1 247 €" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg bg-white px-2 py-1.5 text-center shadow-sm">
                      <p className="font-bold text-emerald-800 text-sm">{kpi.value}</p>
                      <p className="text-[9px] text-emerald-600">{kpi.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="order-1 max-w-xl lg:order-2 lg:ml-auto">
            {eyebrow && <p className="mb-4 font-bold text-blue-700 text-xs uppercase tracking-widest">{eyebrow}</p>}
            <h2 className="font-bold font-display text-4xl text-slate-900 leading-[1.15] tracking-tight md:text-5xl">
              {title}
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">{subtitle}</p>

            {/* Smart Feature Pills */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: Upload, label: "Import CSV Smart", color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: RefreshCw, label: "Sync Shopify", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: RefreshCw, label: "Sync WooCommerce", color: "text-amber-600", bg: "bg-amber-50" },
                { icon: FileText, label: "Mapping Auto", color: "text-purple-600", bg: "bg-purple-50" },
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
                  Voir nos intégrations
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
