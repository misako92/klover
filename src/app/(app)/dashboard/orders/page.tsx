"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRight, CheckCircle2, CloudUpload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { WorkflowJourney } from "@/components/onboarding/workflow-journey";
import { buildWorkflowSteps, getPrimaryWorkflowAction } from "@/components/onboarding/workflow-journey.helpers";
import { useSubscription } from "@/components/subscription/subscription-provider";
import { usePlanGuard } from "@/components/subscription/use-plan-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { parseCsvPreview } from "@/features/compliance/data/csv";
import type { CsvMapping, ImportRunResult } from "@/features/compliance/data/types";
import { cn } from "@/lib/utils";

import { TemplateDownloadButton } from "./_components/template-download-button";

const STEPS = ["Upload", "Mapping", "Previsualisation", "Traitement", "Resume"] as const;

function guessMapping(headers: string[]): CsvMapping {
  const pick = (...patterns: string[]) => {
    return headers.find((header) => patterns.some((pattern) => header.toLowerCase().includes(pattern))) ?? "";
  };

  return {
    sku: pick("sku", "ref", "code"),
    name: pick("nom", "name", "libelle", "produit"),
    quantity: pick("qte", "qty", "quant", "quantity"),
    price: pick("prix", "price", "montant"),
    date: pick("date", "jour"),
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { products, runImport, compliance, imports, declarations } = useComplianceData();
  const plan = useSubscription();
  const { guardProductLimit, UpgradeModalRenderer } = usePlanGuard();

  const [step, setStep] = React.useState<0 | 1 | 2 | 3 | 4>(0);
  const [fileName, setFileName] = React.useState("");
  const [csvText, setCsvText] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [previewRows, setPreviewRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<CsvMapping>({ sku: "", name: "", quantity: "", price: "", date: "" });
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<ImportRunResult | null>(null);
  const [_running, setRunning] = React.useState(false);
  const maxProducts = plan.features.maxProducts;
  const planLimitReached = Number.isFinite(maxProducts) && products.length >= maxProducts;
  const workflowSteps = React.useMemo(
    () => buildWorkflowSteps(compliance, imports, declarations),
    [compliance, imports, declarations],
  );
  const primaryWorkflowAction = React.useMemo(() => getPrimaryWorkflowAction(workflowSteps), [workflowSteps]);

  const canProcess = Boolean(csvText && mapping.sku && mapping.name && mapping.quantity);

  const postImportAction = React.useMemo(() => {
    const reviewCount = Math.max(compliance.needsReviewCount, result?.errors.length ?? 0, result?.createdProducts ?? 0);

    if (reviewCount > 0) {
      return {
        label: `Verifier ${reviewCount} produit${reviewCount > 1 ? "s" : ""}`,
        href: "/dashboard/products?tab=review",
        description: "Les produits encore incomplets doivent etre valides avant declaration.",
      };
    }

    if (compliance.declarationToPrepare) {
      return {
        label: "Ouvrir les declarations",
        href: "/dashboard/declarations",
        description: "Le brouillon du mois peut maintenant etre prepare ou finalise.",
      };
    }

    return primaryWorkflowAction;
  }, [compliance, primaryWorkflowAction, result]);

  const handleFileSelect = async (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("Format non supporte. Utilisez un fichier CSV.");
      return;
    }

    const text = await selected.text();

    try {
      const parsed = parseCsvPreview(text);
      setFileName(selected.name);
      setCsvText(text);
      setHeaders(parsed.headers);
      setPreviewRows(parsed.rows.slice(0, 8).map((row, index) => ({ ...row, _id: String(index) })));
      setMapping(guessMapping(parsed.headers));
      setStep(1);
      setResult(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de lire le CSV.");
    }
  };

  const startProcessing = async () => {
    if (!guardProductLimit(products.length)) {
      return;
    }

    if (!canProcess) {
      toast.error("Mapping incomplet: SKU, nom et quantite sont obligatoires.");
      return;
    }

    setStep(3);
    setProgress(8);
    setRunning(true);

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 88 ? prev : prev + 7));
    }, 220);

    try {
      const summary = await runImport({
        fileName,
        csvText,
        mapping,
      });
      setResult(summary);
      setProgress(100);
      setStep(4);
      toast.success(
        `Import termine - ${summary.importedLines} ligne${summary.importedLines > 1 ? "s" : ""} importee${summary.importedLines > 1 ? "s" : ""}`,
        {
          description: `${summary.createdProducts} nouveaux produits · ${summary.errors.length} erreur${summary.errors.length !== 1 ? "s" : ""}`,
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import echoue.");
      setStep(2);
    } finally {
      window.clearInterval(timer);
      setRunning(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setFileName("");
    setCsvText("");
    setHeaders([]);
    setPreviewRows([]);
    setResult(null);
    setMapping({ sku: "", name: "", quantity: "", price: "", date: "" });
  };

  return (
    <div className="stagger-1 container mx-auto max-w-5xl animate-enter space-y-8 py-8">
      <div className="group flex flex-col gap-2 text-center">
        <h1 className="flex items-baseline justify-center gap-2 font-bold text-4xl tracking-tight">
          Assistant{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-emerald-600 text-transparent">
            d'import
          </span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Importez vos ventes, nettoyez les produits a verifier, puis finalisez la declaration.
        </p>
      </div>

      <WorkflowJourney
        title="Parcours guide"
        description="Utilisez ce repere pour savoir si vous devez importer, verifier le catalogue ou ouvrir la declaration."
        headerAction={<TemplateDownloadButton />}
      />

      <div className="mx-auto mb-10 w-full max-w-4xl space-y-3">
        <div className="text-center font-medium text-muted-foreground text-sm sm:hidden">
          Etape {step + 1} / {STEPS.length} - {STEPS[step]}
        </div>
        <div className="overflow-x-auto pb-12">
          <div className="relative min-w-[680px]">
            <div className="-translate-y-1/2 absolute top-1/2 left-0 h-0.5 w-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/10 to-emerald-500/10" />
            <div
              className="-translate-y-1/2 absolute top-1/2 left-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700 ease-in-out"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />

            <div className="relative flex w-full justify-between">
              {STEPS.map((label, index) => {
                const isActive = step >= index;
                const isCurrent = step === index;

                return (
                  <div key={label} className="group flex cursor-default flex-col items-center gap-3">
                    <div
                      className={cn(
                        "relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                        isActive
                          ? "scale-110 border-emerald-600 bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                          : "border-zinc-200 bg-white text-muted-foreground",
                      )}
                    >
                      {isActive ? (
                        <CheckCircle2 className="zoom-in spin-in-90 size-5 animate-in duration-300" />
                      ) : (
                        <span className="font-semibold text-xs">{index + 1}</span>
                      )}
                      {isCurrent ? (
                        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                      ) : null}
                    </div>

                    <span
                      className={cn(
                        "absolute top-12 hidden w-32 text-center font-semibold text-xs uppercase tracking-wide transition-all duration-300 sm:block",
                        isCurrent
                          ? "-translate-y-1 font-bold text-emerald-700"
                          : isActive
                            ? "text-emerald-600"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-card stagger-2 relative animate-enter overflow-hidden border-border/40 shadow-soft transition-all duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-[0.02] mix-blend-multiply" />
        <CardContent className="relative z-10 p-0">
          {step === 0 ? (
            <div className="fade-in slide-in-from-bottom-4 animate-in p-8 duration-500">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <FileDropzone onFileSelect={handleFileSelect} />

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/10 p-5">
                    <h2 className="font-semibold text-lg">Avant d'importer</h2>
                    <div className="mt-3 space-y-3 text-muted-foreground text-sm">
                      <p>Prepares les colonnes minimales: nom produit, SKU et quantite vendue.</p>
                      <p>Un CSV mensuel propre permet d'alimenter directement le catalogue et les declarations.</p>
                      <p>
                        Si le format varie souvent, commence par telecharger le modele puis adapte ton export source.
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl border p-5 text-sm",
                      planLimitReached
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-emerald-200 bg-emerald-50/40",
                    )}
                  >
                    <div className="font-medium">
                      {planLimitReached ? `Limite du plan ${plan.name} atteinte` : `Capacite du plan ${plan.name}`}
                    </div>
                    <p className="mt-2">
                      {Number.isFinite(maxProducts)
                        ? `${products.length} / ${maxProducts} produits actuellement dans le catalogue.`
                        : "Aucune limite stricte detectee sur le volume catalogue."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <Link href="/dashboard/orders/documentation">Voir le guide CSV</Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href="/dashboard/products?tab=review">Voir les produits a verifier</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="fade-in slide-in-from-bottom-4 animate-in space-y-6 p-8 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">Correspondance des colonnes</h2>
                  <p className="text-muted-foreground text-sm">
                    Associez les colonnes de votre fichier ({fileName}) aux champs utilises par Klover.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetWizard}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-2 size-4" />
                  Annuler
                </Button>
              </div>

              <div className="rounded-xl border border-emerald-200 border-dashed bg-emerald-50/30 p-4 text-muted-foreground text-sm">
                Champs obligatoires pour continuer: SKU, nom produit et quantite vendue.
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MappingCard
                  label="SKU / Reference"
                  required
                  value={mapping.sku}
                  options={headers}
                  onChange={(value) => setMapping((previous) => ({ ...previous, sku: value }))}
                />
                <MappingCard
                  label="Nom du produit"
                  required
                  value={mapping.name}
                  options={headers}
                  onChange={(value) => setMapping((previous) => ({ ...previous, name: value }))}
                />
                <MappingCard
                  label="Quantite vendue"
                  required
                  value={mapping.quantity}
                  options={headers}
                  onChange={(value) => setMapping((previous) => ({ ...previous, quantity: value }))}
                />
                <MappingCard
                  label="Prix unitaire"
                  value={mapping.price ?? ""}
                  options={headers}
                  onChange={(value) => setMapping((previous) => ({ ...previous, price: value }))}
                />
                <MappingCard
                  label="Date de vente"
                  value={mapping.date ?? ""}
                  options={headers}
                  onChange={(value) => setMapping((previous) => ({ ...previous, date: value }))}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                  Continuer
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="fade-in slide-in-from-bottom-4 flex h-[500px] animate-in flex-col duration-500">
              <div className="flex flex-col gap-4 border-b bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-lg">Verification des donnees</h2>
                  <p className="text-muted-foreground text-sm">
                    Apercu des 8 premieres lignes telles qu'elles seront traitees.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button onClick={startProcessing} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                    Confirmer et importer
                    <CloudUpload className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-muted/5">
                <Table>
                  <TableHeader className="sticky top-0 bg-background shadow-sm">
                    <TableRow>
                      <TableHead className="w-[150px]">SKU</TableHead>
                      <TableHead>Nom produit</TableHead>
                      <TableHead className="w-[100px] text-right">Quantite</TableHead>
                      <TableHead className="w-[150px]">Matiere detectee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row) => (
                      <TableRow key={row._id} className="hover:bg-muted/40">
                        <TableCell className="font-medium font-mono text-xs">{row[mapping.sku]}</TableCell>
                        <TableCell>{row[mapping.name]}</TableCell>
                        <TableCell className="text-right tabular-nums">{row[mapping.quantity]}</TableCell>
                        <TableCell className="text-muted-foreground text-xs italic">
                          Detection automatique apres import
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="fade-in zoom-in-95 flex animate-in flex-col items-center justify-center px-8 py-24 text-center duration-500">
              <div className="relative mb-6 size-20">
                <Loader2 className="size-20 animate-spin text-emerald-100" />
                <Loader2
                  className="absolute top-0 left-0 size-20 animate-spin text-emerald-600 duration-1000"
                  style={{ animationDirection: "reverse" }}
                />
              </div>
              <h2 className="mb-2 font-semibold text-xl">Traitement en cours...</h2>
              <p className="mb-8 max-w-sm text-muted-foreground">
                Nous analysons votre fichier, mettons a jour le catalogue et preparons la suite du parcours.
              </p>
              <div className="w-full max-w-md space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Lecture CSV</span>
                  <span>Classification</span>
                  <span>Sauvegarde</span>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 && result ? (
            <div
              className="fade-in slide-in-from-bottom-8 flex animate-in flex-col items-center p-12 text-center duration-700"
              aria-live="polite"
            >
              <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="mb-2 font-bold text-2xl text-emerald-900">Import reussi</h2>
              <p className="mb-8 text-muted-foreground">
                Les ventes ont ete integrees. Le prochain geste depend maintenant de votre niveau de verification.
              </p>

              <div className="mb-8 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
                <ResultCard label="Lignes traitees" value={result.importedLines} />
                <ResultCard label="Nouveaux produits" value={result.createdProducts} highlight />
                <ResultCard label="Mises a jour" value={result.updatedProducts} />
                <ResultCard label="Erreurs" value={result.errors.length} error={result.errors.length > 0} />
              </div>

              <div className="mb-8 w-full max-w-2xl rounded-2xl border border-emerald-200 border-dashed bg-emerald-50/30 p-5 text-left">
                <div className="font-semibold text-sm">Prochaine etape recommandee</div>
                <p className="mt-1 text-muted-foreground text-sm">{postImportAction.description}</p>
              </div>

              {result.errors.length > 0 ? (
                <div className="mb-8 w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-left">
                  <div className="font-semibold text-amber-900 text-sm">Lignes a corriger</div>
                  <p className="mt-1 text-amber-800/80 text-sm">
                    Les erreurs suivantes n'ont pas ete importees. Corrigez-les dans le CSV source avant relance.
                  </p>
                  <ul className="mt-4 space-y-2 text-amber-900 text-sm">
                    {result.errors.slice(0, 5).map((error) => (
                      <li key={error} className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2">
                        {error}
                      </li>
                    ))}
                  </ul>
                  {result.errors.length > 5 ? (
                    <p className="mt-3 text-amber-800/80 text-xs">
                      {result.errors.length - 5} erreur(s) supplementaire(s) restent a corriger.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" onClick={resetWizard}>
                  Nouvel import
                </Button>
                <Button
                  className="bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                  onClick={() => router.push(postImportAction.href)}
                >
                  {postImportAction.label}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <UpgradeModalRenderer />
    </div>
  );
}

function MappingCard({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "hover:-translate-y-1 group cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:shadow-soft-lg",
        value
          ? "border-emerald-200 bg-emerald-50/50 shadow-sm"
          : "border-border/60 bg-white/70 shadow-sm hover:border-emerald-200",
      )}
    >
      <Label className="mb-2 block font-semibold text-muted-foreground text-xs uppercase tracking-wider transition-colors group-hover:text-emerald-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-border/40 bg-white/80 shadow-sm transition-colors hover:bg-white focus:bg-white">
          <SelectValue placeholder="Choisir une colonne..." />
        </SelectTrigger>
        <SelectContent className="glass-panel border-white/60">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ResultCard({
  label,
  value,
  highlight,
  error,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "hover:-translate-y-1 glass-card flex cursor-default flex-col items-center gap-1 rounded-2xl border p-4 transition-all duration-300 hover:shadow-soft-lg",
        error
          ? "border-red-200 bg-red-50/80 hover:shadow-red-500/10"
          : highlight
            ? "border-emerald-200 bg-emerald-50/60 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] hover:shadow-emerald-500/10"
            : "border-border/40 bg-white/70 hover:border-emerald-100",
      )}
    >
      <span
        className={cn(
          "font-bold text-2xl tracking-tight",
          error ? "text-red-600" : highlight ? "text-emerald-600" : "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
    </div>
  );
}
