import Link from "next/link";

import type { Metadata } from "next";

import { SectionHeader } from "@/components/marketing/layout/SectionHeader";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mentions légales — Klover",
  description: "Informations légales et conditions d’édition du site Klover.",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <SectionWrapper className="pt-24">
        <SectionHeader
          eyebrow="Juridique"
          title="Mentions légales"
          subtitle="Informations sur l’éditeur du site, l’hébergement et les conditions d’utilisation."
        />

        <div className="mt-10 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Éditeur du site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>Klover SAS — société en cours d'immatriculation.</p>
              <p>Siège social : Paris, France.</p>
              <p>RCS / SIREN : en cours d'obtention.</p>
              <p>Directeur de publication : le représentant légal de Klover SAS.</p>
              <p>Contact : contact@klover.co</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hébergement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>Hébergeur : Vercel Inc.</p>
              <p>Adresse : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
              <p>Site : vercel.com</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>
                L’ensemble des contenus (textes, visuels, logos, marque) est protégé. Toute reproduction non autorisée
                est interdite.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Données personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>
                Consultez la page{" "}
                <Link href="/privacy" className="text-emerald-700 hover:underline">
                  Politique de confidentialité
                </Link>{" "}
                pour comprendre le traitement des données.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </main>
  );
}
