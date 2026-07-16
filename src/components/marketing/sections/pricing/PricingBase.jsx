"use client";

import { useState } from "react";

import Link from "next/link";

import { Check } from "lucide-react";

export function PricingBase({ title, subtitle, plans }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="px-4 py-24" id="pricing">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>

          {/* Toggle annuel/mensuel */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 font-medium text-sm transition-all ${
                !annual ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-medium text-sm transition-all ${
                annual ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-600 text-xs">
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                plan.featured
                  ? "md:-my-2 border-emerald-500/50 bg-slate-900 text-white shadow-2xl shadow-emerald-500/10 md:scale-[1.03]"
                  : "hover:-translate-y-0.5 border-border bg-card hover:shadow-lg"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className={`-top-3 -translate-x-1/2 absolute left-1/2 whitespace-nowrap rounded-full px-3 py-0.5 font-semibold text-xs ${
                    plan.featured ? "bg-emerald-500 text-white" : "border border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name + description */}
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.featured ? "text-slate-300" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mt-6 mb-1">
                {plan.monthlyPrice != null ? (
                  <>
                    <span className="font-bold text-4xl">{annual ? plan.annualPrice : plan.monthlyPrice}€</span>
                    <span className={`ml-1 text-sm ${plan.featured ? "text-slate-300" : "text-muted-foreground"}`}>
                      /mois
                    </span>
                    {annual && (
                      <p className={`mt-1 text-xs ${plan.featured ? "text-emerald-400" : "text-emerald-600"}`}>
                        Facturé annuellement — économisez {(plan.monthlyPrice - plan.annualPrice) * 12}€/an
                      </p>
                    )}
                  </>
                ) : (
                  <span className="font-bold text-3xl">Sur devis</span>
                )}
              </div>

              {/* CTA */}
              <Link
                href={plan.cta.href}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  plan.featured
                    ? "bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:ring-emerald-500"
                    : "border border-border bg-background hover:bg-muted focus-visible:ring-ring"
                }`}
              >
                {plan.cta.label}
              </Link>

              {/* Separator */}
              <div className={`mt-8 mb-4 h-px ${plan.featured ? "bg-white/10" : "bg-border"}`} />

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden="true"
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-emerald-400" : "text-emerald-600"}`}
                    />
                    <span className={`text-sm leading-relaxed ${plan.featured ? "text-slate-200" : ""}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
