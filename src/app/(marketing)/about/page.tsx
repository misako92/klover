import { Shield, Target, Users } from "lucide-react";

import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";

export const metadata = {
  title: "À propos — Klover",
  description:
    "Klover aide les e-commerçants à maîtriser leur conformité AGEC/REP avec un monitoring continu et un audit trail opposable.",
};

const values = [
  {
    icon: Shield,
    title: "Conformité sans compromis",
    description:
      "Chaque fonctionnalité est pensée pour réduire les risques réglementaires et financiers des e-commerçants soumis aux obligations REP.",
  },
  {
    icon: Target,
    title: "Automatisation utile",
    description:
      "Nous automatisons ce qui peut l'être — classification, calcul de tonnages, alertes — pour que les équipes se concentrent sur les décisions.",
  },
  {
    icon: Users,
    title: "Pensé pour les équipes ops",
    description:
      "Klover est conçu pour les responsables conformité, ops et finance qui gèrent au quotidien les obligations REP de leur entreprise.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-white">
      <SectionWrapper id="about" className="pt-24 pb-16 md:pt-32" maxWidth="max-w-4xl">
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-700 text-xs">
            À propos
          </div>
          <h1 className="mb-4 font-bold text-3xl text-slate-900 tracking-tight md:text-4xl">
            La conformité REP ne devrait pas être un casse-tête.
          </h1>
          <p className="max-w-2xl text-lg text-slate-500 leading-relaxed">
            Klover est né d'un constat simple : les e-commerçants français perdent un temps considérable à gérer
            manuellement leurs obligations AGEC/REP — souvent avec des fichiers Excel fragiles et sans traçabilité.
          </p>
          <p className="mt-4 max-w-2xl text-lg text-slate-500 leading-relaxed">
            Notre mission est de transformer la conformité en un processus continu, automatisé et auditable. Un outil
            qui surveille vos données, vous alerte sur les écarts, et génère des exports conformes quand nécessaire.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="flex flex-col gap-3">
              <div className="w-fit rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <v.icon className="size-5" />
              </div>
              <h3 className="font-bold text-slate-900">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-emerald-100 bg-emerald-50 p-8">
          <h3 className="mb-2 font-bold text-emerald-900 text-lg">Nous contacter</h3>
          <p className="text-emerald-700 text-sm">
            Une question ? Un besoin spécifique ?{" "}
            <a href="/contact" className="font-medium underline hover:text-emerald-900">
              Écrivez-nous
            </a>{" "}
            ou envoyez un email à{" "}
            <a href="mailto:contact@klover.co" className="font-medium underline hover:text-emerald-900">
              contact@klover.co
            </a>
            .
          </p>
        </div>
      </SectionWrapper>
    </main>
  );
}
