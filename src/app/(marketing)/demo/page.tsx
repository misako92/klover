import Link from "next/link";

import { ArrowRight, BarChart3, FileCheck, Shield, Upload } from "lucide-react";
import type { Metadata } from "next";

import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Démo — Klover",
  description: "Découvrez comment Klover automatise la conformité REP : import, classification, déclaration.",
};

const features = [
  {
    icon: Upload,
    title: "Import CSV en 1 clic",
    description: "Glissez votre fichier de ventes, Klover mappe automatiquement les colonnes.",
  },
  {
    icon: Shield,
    title: "Classification assistée",
    description: "Chaque produit est classifié par matière avec un score de confiance. Les cas ambigus sont signalés.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord en temps réel",
    description: "Tonnages, contributions estimées, alertes et prochaines actions — tout en un coup d'œil.",
  },
  {
    icon: FileCheck,
    title: "Déclarations prêtes à l'export",
    description: "Générez un fichier conforme CITEO/Léko, avec audit trail horodaté.",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <SectionWrapper className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-medium text-emerald-600 text-sm uppercase tracking-wide">Découvrir Klover</p>
          <h1 className="mb-4 font-bold text-3xl text-slate-900 md:text-4xl">
            Comment Klover simplifie votre conformité REP
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600">
            De l'import de vos ventes à l'export de vos déclarations, chaque étape est guidée et traçable.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {features.map((feature, i) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <feature.icon className="size-5" />
                </div>
                <span className="font-mono text-emerald-600/60 text-sm">Étape {String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mb-2 font-semibold text-lg text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 text-slate-600">Prêt à tester avec vos propres données ?</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/auth/v2/register">
                Créer un compte gratuit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Demander une démo personnalisée</Link>
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
