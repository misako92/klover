import Link from "next/link";

import type { Metadata } from "next";

import { SectionHeader } from "@/components/marketing/layout/SectionHeader";
import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Klover",
  description: "Comprendre quelles données sont traitées et pourquoi.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <SectionWrapper className="pt-24">
        <SectionHeader
          eyebrow="Confidentialité"
          title="Politique de confidentialité"
          subtitle="Cette page décrit les traitements de données liés à l’utilisation de Klover."
        />

        <div className="mt-10 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Données collectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>
                Nous collectons les informations que vous fournissez (nom, email, message) et les données techniques
                nécessaires au fonctionnement du service (logs, cookies techniques).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finalités</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>
                Les données sont utilisées pour répondre aux demandes, améliorer le service, assurer la sécurité et
                respecter les obligations légales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Durée de conservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>Les données sont conservées pour la durée nécessaire aux finalités décrites.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vos droits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground text-sm">
              <p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données en nous contactant.</p>
              <p>
                Contact :{" "}
                <Link href="/contact" className="text-emerald-700 hover:underline">
                  /contact
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </main>
  );
}
