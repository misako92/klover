import Link from "next/link";

import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SectionHeader } from "@/components/marketing/layout/SectionHeader";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StepIllustration({ step, icon: Icon }) {
  if (step === "01") {
    // Import CSV illustration
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Icon className="size-5 text-emerald-600" />
            <span className="font-semibold text-slate-700 text-sm">Import de fichier</span>
          </div>
          <div className="rounded-lg border-2 border-emerald-200 border-dashed bg-emerald-50/50 p-6 text-center">
            <Icon className="mx-auto size-8 text-emerald-400" strokeWidth={1.5} />
            <p className="mt-2 font-medium text-emerald-700 text-xs">Glissez votre fichier CSV ici</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {["commandes-mars.csv", "ventes-q1.csv"].map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span className="text-slate-600 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "02") {
    // Classification illustration
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Icon className="size-5 text-emerald-600" />
            <span className="font-semibold text-slate-700 text-sm">Classification</span>
          </div>
          <div className="space-y-2">
            {[
              { name: "Boîte carton 30x20", mat: "Carton", conf: "98%", color: "bg-emerald-500" },
              { name: "Flacon PET 250ml", mat: "Plastique PET", conf: "95%", color: "bg-emerald-500" },
              { name: "Pot en verre 500g", mat: "Verre", conf: "72%", color: "bg-amber-500" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-700 text-xs">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.mat}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", p.color)} style={{ width: p.conf }} />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{p.conf}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Export illustration (step 03)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="size-5 text-emerald-600" />
          <span className="font-semibold text-slate-700 text-sm">Déclaration prête</span>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-emerald-800 text-sm">CITEO — Mars 2026</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: "Tonnage total", value: "2.45 t" },
              { label: "Contribution", value: "1 247 €" },
              { label: "Produits classés", value: "142 / 142" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-emerald-700">{row.label}</span>
                <span className="font-semibold text-emerald-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-center font-medium text-white text-xs">
          Télécharger le PDF
        </div>
      </div>
    </div>
  );
}

/**
 * HowItWorks - 3-step workflow section with glassmorphic cards and animated connections
 * @param {{ id?: string, eyebrow?: string, title?: string, subtitle?: string, align?: string, steps?: any[], cta?: any, className?: string }} props
 */
export function HowItWorksSection({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
  steps = [],
  cta,
  className = /** @type {string | undefined} */ (undefined),
}) {
  return (
    <SectionWrapper id={id} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} align={align} className="mb-12 md:mb-16" />

      <div className="mt-16 flex flex-col gap-24 sm:mt-24 lg:gap-32">
        {steps.map((step, index) => {
          const isEven = index % 2 === 1;
          const IconComponent = step.icon;
          return (
            <div key={step.step} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Text content */}
              <div className={cn("flex animate-fade-in-up flex-col", isEven && "lg:order-2")}>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                    <IconComponent className="size-6" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-emerald-700 text-sm uppercase tracking-widest">
                    ETAPE {step.step}
                  </span>
                </div>
                <h3 className="mb-6 font-bold font-display text-3xl text-slate-900 leading-tight lg:text-4xl">
                  {step.title}
                </h3>
                <p className="max-w-lg text-lg text-slate-600 leading-relaxed">{step.description}</p>
              </div>

              {/* Step illustration */}
              <div className={cn("relative animate-fade-in-up delay-100", isEven && "lg:order-1")}>
                <div className="hover:-translate-y-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 p-8 shadow-2xl shadow-emerald-900/10 ring-1 ring-emerald-100/50 backdrop-blur-3xl transition-all duration-500 hover:shadow-emerald-900/20">
                  <StepIllustration step={step.step} icon={IconComponent} />
                </div>

                {/* Decorative background glow */}
                <div
                  className={cn(
                    "-translate-y-1/2 -z-10 absolute top-1/2 h-[120%] w-[120%] rounded-full opacity-40 blur-[100px]",
                    isEven ? "-left-[10%] bg-teal-300" : "-right-[10%] bg-emerald-300",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {cta && (
        <div className="mt-16 flex animate-fade-in-up justify-center delay-500">
          <Button
            asChild
            size="lg"
            className="group h-14 rounded-full bg-[#0a945b] px-8 font-semibold text-white shadow-[0_8px_16px_rgba(10,148,91,0.25)] transition-all hover:scale-105 hover:bg-[#088250]"
          >
            <Link href={cta.href}>
              {cta.label}
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      )}
    </SectionWrapper>
  );
}
