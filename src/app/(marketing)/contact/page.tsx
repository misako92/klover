"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  Package,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";

import { submitContactForm } from "@/app/actions/contact";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Shield,
    title: "Audit personnalisé",
    description: "Analyse complète de votre situation REP actuelle et des risques potentiels.",
  },
  {
    icon: Clock,
    title: "Réponse sous 24h",
    description: "Notre équipe vous contacte rapidement avec des recommandations concrètes.",
  },
  {
    icon: FileCheck,
    title: "Plan d'action",
    description: "Recevez un plan détaillé pour atteindre la conformité REP complète.",
  },
];

const companyTypes = [
  { value: "ecommerce", label: "E-commerce (site propre)" },
  { value: "marketplace", label: "Marketplace (Amazon, Cdiscount...)" },
  { value: "both", label: "Les deux" },
  { value: "retail", label: "Retail physique" },
];

const productCounts = [
  { value: "1-100", label: "1 - 100 produits" },
  { value: "100-1000", label: "100 - 1 000 produits" },
  { value: "1000-10000", label: "1 000 - 10 000 produits" },
  { value: "10000+", label: "10 000+ produits" },
];

const urgencyLevels = [
  { value: "urgent", label: "Urgent - Contrôle imminent", color: "text-red-600" },
  { value: "soon", label: "Bientôt - Dans les 3 mois", color: "text-amber-600" },
  { value: "planning", label: "Planification - Pas de deadline", color: "text-emerald-600" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    company: "",
    email: "",
    companyType: "",
    productCount: "",
    urgency: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitContactForm(formData as Parameters<typeof submitContactForm>[0]);
        setIsSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer.");
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Background decoration */}
      <div className="-translate-y-1/2 absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 rounded-full bg-gradient-to-br from-emerald-100/40 to-transparent blur-3xl" />
      <div className="-translate-x-1/3 absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/2 rounded-full bg-gradient-to-tr from-emerald-100/40 to-transparent blur-3xl" />

      <SectionWrapper id="contact" className="pt-24 pb-16 md:pt-32" maxWidth="max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Left column - Form */}
          <div className="relative">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-700 text-xs">
                <Sparkles className="size-3.5" />
                Contact & Diagnostic
              </div>
              <h1 className="mb-4 font-bold text-3xl text-slate-900 tracking-tight md:text-4xl">
                Parlez à un expert conformité
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                Répondez à quelques questions pour nous aider à préparer votre diagnostic personnalisé.
              </p>
            </div>

            {isSubmitted ? (
              /* Success state */
              <div className="fade-in zoom-in animate-in rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center duration-500">
                <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-4 text-emerald-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="mb-2 font-bold text-emerald-900 text-xl">Demande envoyée !</h3>
                <p className="mb-6 text-emerald-700">
                  Notre équipe vous contactera sous 24h avec votre diagnostic personnalisé.
                </p>
                <Button asChild variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                  <Link href="/">Retour à l'accueil</Link>
                </Button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company & Email row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="mb-2 block font-medium text-slate-700 text-sm">
                      Nom de l'entreprise *
                    </label>
                    <div className="relative">
                      <Building2 className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-slate-400" />
                      <input
                        type="text"
                        id="company"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Votre entreprise"
                        className="w-full rounded-xl border border-emerald-100 bg-white py-3 pr-4 pl-10 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block font-medium text-slate-700 text-sm">
                      Email professionnel *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="vous@entreprise.com"
                      className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Company type */}
                <div>
                  <label htmlFor="companyType" className="mb-2 block font-medium text-slate-700 text-sm">
                    Type d'activité *
                  </label>
                  <select
                    id="companyType"
                    name="companyType"
                    required
                    value={formData.companyType}
                    onChange={handleChange}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-emerald-100 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sélectionnez votre activité</option>
                    {companyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product count */}
                <div>
                  <div className="mb-3 block font-medium text-slate-700 text-sm">Nombre de produits *</div>
                  <div className="grid grid-cols-2 gap-3">
                    {productCounts.map((count) => (
                      <label
                        key={count.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          formData.productCount === count.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                            : "border-emerald-100 bg-white hover:border-emerald-300",
                        )}
                      >
                        <input
                          type="radio"
                          name="productCount"
                          value={count.value}
                          checked={formData.productCount === count.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Package
                          className={cn(
                            "size-4",
                            formData.productCount === count.value ? "text-emerald-600" : "text-slate-400",
                          )}
                        />
                        <span className="font-medium text-sm">{count.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <div className="mb-3 block font-medium text-slate-700 text-sm">Niveau d'urgence</div>
                  <div className="grid gap-3">
                    {urgencyLevels.map((level) => (
                      <label
                        key={level.value}
                        className={cn(
                          "limit-content flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          formData.urgency === level.value
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-emerald-100 bg-white hover:border-emerald-300",
                        )}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={level.value}
                          checked={formData.urgency === level.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <AlertTriangle className={cn("size-4", level.color)} />
                        <span className="font-medium text-slate-700 text-sm">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="mb-2 block font-medium text-slate-700 text-sm">
                    Détails supplémentaires (optionnel)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Décrivez votre situation actuelle, vos préoccupations..."
                    className="w-full resize-none rounded-xl border border-emerald-100 bg-white px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="w-full gap-2 bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  Demander mon diagnostic gratuit
                  <ArrowRight className="size-4" />
                </Button>

                <p className="text-center text-slate-400 text-xs">
                  En soumettant ce formulaire, vous acceptez notre{" "}
                  <Link href="/privacy" className="underline hover:text-emerald-600">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>

          {/* Right column - Benefits */}
          <div className="hidden lg:sticky lg:top-32 lg:block">
            {/* Benefits card */}
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-emerald-900/5 shadow-xl backdrop-blur-sm md:p-8">
              <h3 className="mb-6 font-bold text-lg text-slate-900">Ce que vous recevrez</h3>

              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit.title}
                    className="fade-in slide-in-from-right-4 flex animate-in items-start gap-4 duration-700"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="shrink-0 rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                      <benefit.icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-slate-900">{benefit.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust indicator */}
              <div className="mt-8 border-emerald-100 border-t pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="-space-x-2 flex">
                    {["M", "L", "K"].map((initial) => (
                      <div
                        key={initial}
                        className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white text-xs shadow-sm"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-500">
                    <span className="font-semibold text-slate-900">50+ entreprises</span> accompagnées
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative CTA */}
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="mb-3 font-medium text-emerald-800 text-sm">Vous préférez voir le produit en action ?</p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
              >
                <Link href="/auth/v2/register" className="gap-2">
                  Commencer gratuitement
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
