"use client";

import Link from "next/link";

import { ArrowLeft, CheckCircle2, FileSpreadsheet, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { TemplateDownloadButton } from "../_components/template-download-button";

const requiredColumns = ["SKU ou référence produit", "Nom produit", "Quantité vendue"];

const optionalColumns = [
  "Prix unitaire",
  "Date de vente",
  "Colonnes métier internes conservées dans votre export source",
];

export default function OrdersDocumentationPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 size-4" />
            Retour à l'import
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">Guide CSV</h1>
          <p className="max-w-2xl text-muted-foreground">
            Préparez un fichier simple, mappez les colonnes obligatoires, puis importez vos ventes pour alimenter le
            catalogue et les déclarations.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-emerald-600" />
              Structure attendue
            </CardTitle>
            <CardDescription>
              Le mapping reste flexible, mais ces champs doivent être présents dans votre export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                Colonnes obligatoires
              </h2>
              <div className="space-y-2">
                {requiredColumns.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                Colonnes optionnelles
              </h2>
              <div className="space-y-2">
                {optionalColumns.map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WandSparkles className="size-5 text-emerald-600" />
              Démarrage rapide
            </CardTitle>
            <CardDescription>Le plus simple pour éviter les retours de mapping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TemplateDownloadButton />
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>1. Télécharge le modèle Klover et compare-le avec ton export source.</p>
              <p>2. Garde une ligne d'en-tête claire et une ligne par vente ou par agrégat produit.</p>
              <p>3. Vérifie ensuite les produits à compléter avant de générer la déclaration.</p>
            </div>
            <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href="/dashboard/orders">Ouvrir l'assistant d'import</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
