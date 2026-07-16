import React from "react";

import { SectionHeader } from "@/components/marketing/layout/SectionHeader";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Ultra-Premium Dark Bento Risk Card
const RiskCard = React.memo(function RiskCard({ risk, index }) {
  const IconComponent = risk.icon;
  const isDark = index === 0;

  const bentoClasses = cn(
    "group flex flex-col overflow-hidden transition-all duration-500",
    "animate-fade-in-up",
    index === 0 && "md:col-span-2 md:row-span-1 min-h-[340px] delay-100",
    index === 1 && "md:col-span-1 md:row-span-1 delay-200",
    index === 2 && "md:col-span-1 md:row-span-1 delay-300",
  );

  return (
    <article className={bentoClasses}>
      <div
        className={cn(
          "hover:-translate-y-2 relative flex h-full flex-col justify-between overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 md:p-12",
          isDark
            ? "border border-transparent bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:border-rose-500/30"
            : "border border-white/60 bg-white/60 text-slate-900 shadow-slate-200/50 shadow-xl backdrop-blur-xl hover:border-rose-200 hover:bg-white/90 hover:shadow-rose-100/50",
        )}
      >
        {/* Glow effect for dark card */}
        {isDark && (
          <div className="-top-32 -right-32 absolute h-80 w-80 rounded-full bg-rose-500/15 blur-[80px] transition-all duration-500 group-hover:bg-rose-500/25" />
        )}

        <div className="relative z-10 flex h-full flex-col">
          {/* Icon */}
          <div
            className={cn(
              "group-hover:-rotate-3 mb-8 flex size-16 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg",
              isDark
                ? "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:shadow-rose-500/20"
                : "bg-rose-50 text-rose-600 group-hover:bg-rose-100 group-hover:shadow-rose-200/50",
            )}
          >
            <IconComponent className="size-8" strokeWidth={1.5} />
          </div>

          <div className="mt-auto">
            <h3
              className={cn(
                "mb-4 font-bold font-display text-2xl tracking-tight transition-colors duration-300 md:text-3xl",
                isDark ? "text-white group-hover:text-rose-50" : "text-slate-900 group-hover:text-rose-950",
              )}
            >
              {risk.title}
            </h3>
            <p
              className={cn(
                "max-w-lg font-medium text-lg leading-relaxed",
                isDark ? "text-slate-300" : "text-slate-600 group-hover:text-slate-700",
              )}
            >
              {risk.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
});

export function RisksSection({
  id,
  eyebrow,
  title = "Les Risques de Non-Conformité REP",
  subtitle,
  align = "center",
  maxWidth = "max-w-7xl",
  className = /** @type {string | undefined} */ (undefined),
  risks = /** @type {any[]} */ ([]),
  cta,
}) {
  const hasRisks = Array.isArray(risks) && risks.length > 0;

  return (
    <SectionWrapper id={id} maxWidth={maxWidth} className={className}>
      <div className="flex flex-col gap-12 md:gap-16">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align={align}
          className="mx-auto max-w-3xl"
        />

        {hasRisks && (
          <div className="relative">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:auto-rows-[minmax(320px,auto)]">
              {risks.map((risk, index) => (
                <RiskCard key={risk.id || index} risk={risk} index={index} />
              ))}
            </div>
          </div>
        )}

        {cta && (
          <div className="mx-auto mt-8 flex flex-col items-center gap-8 text-center">
            <p className="max-w-2xl font-medium text-lg text-slate-900">{cta.message}</p>
            <Button
              asChild
              size="lg"
              className="group hover:-translate-y-0.5 relative h-14 overflow-hidden rounded-full bg-slate-900 px-8 font-semibold text-white shadow-slate-900/10 shadow-xl transition-all duration-300 hover:bg-slate-800 hover:shadow-2xl"
            >
              <a href={cta.href}>
                <span className="relative z-10">{cta.label}</span>
              </a>
            </Button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
