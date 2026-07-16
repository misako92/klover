"use client";

import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { usePlanGuard } from "@/components/subscription/use-plan-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeclarationCertificate } from "@/features/compliance/components/pdf/declaration-certificate";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export default function DeclarationsPage() {
  const { declarations, createCurrentMonthDraft, submitDeclaration, exportDeclaration, compliance, kpis } =
    useComplianceData();
  const { guard, UpgradeModalRenderer } = usePlanGuard();

  const sorted = [...declarations].sort((a, b) => b.period.localeCompare(a.period));
  const currentMonthKey = format(new Date(), "yyyy-MM");
  const periodLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const currentMonthDeclaration = sorted.find((item) => item.period === currentMonthKey) ?? null;
  const _hasCurrentDraft = Boolean(currentMonthDeclaration);
  const _latestSubmittedDeclaration = sorted.find((item) => item.status === "SUBMITTED") ?? null;

  const handleCreateDraft = async () => {
    const created = await createCurrentMonthDraft();
    if (!created) {
      toast.info("Un brouillon existe deja pour la periode en cours.");
      return;
    }
    toast.success("Brouillon cree.");
  };

  const handleSubmit = async (id: string) => {
    await submitDeclaration(id);
    toast.success("Declaration marquee comme soumise.");
  };

  const handleExport = async (id: string) => {
    if (!guard("canExport", "L'export de declarations")) return;
    const result = await exportDeclaration(id);
    downloadCsv(result.csv, result.fileName);
    toast.success("Export CSV genere.");
  };

  const handleDownloadCertificate = async (declaration: {
    id: string;
    period: string;
    ecoOrganism: string;
    totalTonnageKg: number;
    estimatedAmountEur: number;
    submittedAt: string | null;
    generatedAt: string;
  }) => {
    try {
      toast.loading("Generation du certificat...");
      const blob = await pdf(
        <DeclarationCertificate
          data={{
            id: declaration.id,
            period: declaration.period,
            ecoOrganism: declaration.ecoOrganism || "Non defini",
            tonnage: declaration.totalTonnageKg,
            amount: declaration.estimatedAmountEur,
            date: new Date(declaration.submittedAt ?? declaration.generatedAt).toLocaleDateString("fr-FR"),
            companyName: "Votre organisation",
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificat_conformite_${declaration.period}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss();
      toast.success("Certificat telecharge");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Erreur lors de la generation du PDF");
    }
  };

  const checklist = [
    {
      id: "imports",
      label: "Import du mois disponible",
      description: compliance.missingImportCurrentMonth
        ? "Ajoutez le dernier import de ventes avant de finaliser la declaration."
        : "Les ventes du mois courant sont bien prises en compte.",
      done: !compliance.missingImportCurrentMonth,
      href: "/dashboard/orders",
      cta: "Ouvrir les imports",
    },
    {
      id: "catalog",
      label: "Catalogue pret a declarer",
      description:
        compliance.needsReviewCount > 0
          ? `${compliance.needsReviewCount} produit(s) restent a verifier dans le catalogue.`
          : "Le catalogue du mois est integralement classe.",
      done: compliance.needsReviewCount === 0,
      href: "/dashboard/products?tab=review",
      cta: "Verifier le catalogue",
    },
    {
      id: "idu",
      label: "IDU organisation renseigne",
      description: compliance.isIduMissing
        ? "Ajoutez l'IDU dans les parametres avant depot externe."
        : "L'identifiant unique de l'organisation est enregistre.",
      done: !compliance.isIduMissing,
      href: "/dashboard/settings",
      cta: "Ouvrir les parametres",
    },
    {
      id: "tariff",
      label: "Bareme snapshotte",
      description: currentMonthDeclaration?.tariffVersionLabel
        ? `${currentMonthDeclaration.tariffVersionLabel}${currentMonthDeclaration.tariffEffectiveFrom ? ` - effet ${new Date(currentMonthDeclaration.tariffEffectiveFrom).toLocaleDateString("fr-FR")}` : ""}.`
        : "Le brouillon du mois n'embarque pas encore de version de bareme visible.",
      done: Boolean(currentMonthDeclaration?.tariffVersionLabel),
      href: "/dashboard/settings",
      cta: "Voir les baremes",
    },
  ];

  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const isReadyToSubmit = Boolean(
    currentMonthDeclaration && currentMonthDeclaration.status === "DRAFT" && checklist.every((item) => item.done),
  );

  return (
    <div className="stagger-1 container mx-auto max-w-6xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 text-xs">
            <FileText className="size-3.5" />
            Pilotage mensuel
          </div>
          <div>
            <h1 className="flex items-baseline gap-2 font-bold text-4xl text-slate-800 tracking-tight">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-emerald-600 text-transparent">
                Declarations
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Suivez le brouillon du mois, verifiez les points bloquants avant depot et gardez l'historique des
              declarations deja soumises.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-border/60 bg-white/70 px-3 py-1 text-foreground text-xs">
            {periodLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-xs shadow-sm",
              compliance.needsReviewCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {compliance.needsReviewCount > 0
              ? `${compliance.needsReviewCount} produit(s) a verifier`
              : "Catalogue pret pour declaration"}
          </Badge>
        </div>
      </div>

      {/* 1. KPIs (Top Row) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Statut du mois"
          value={
            currentMonthDeclaration
              ? currentMonthDeclaration.status === "SUBMITTED"
                ? "Soumise"
                : "Brouillon actif"
              : "Aucun brouillon"
          }
          description={periodLabel}
          icon={
            currentMonthDeclaration?.status === "SUBMITTED" ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : currentMonthDeclaration?.status === "DRAFT" ? (
              <Clock3 className="size-5 text-amber-500" />
            ) : (
              <AlertTriangle className="size-5 text-slate-400" />
            )
          }
        />
        <MetricCard
          title="Montant estime global"
          value={kpis.estimatedContributionEur.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          description="Projection globale"
          icon={<FileText className="size-5 text-emerald-500" />}
        />
        <MetricCard
          title="Tonnage consolide"
          value={
            currentMonthDeclaration
              ? `${currentMonthDeclaration.totalTonnageKg.toLocaleString("fr-FR")} kg`
              : "En attente"
          }
          description={currentMonthDeclaration?.ecoOrganism ?? "A definir"}
          icon={<Sparkles className="size-5 text-emerald-500" />}
        />
        <MetricCard
          title="Couverture catalogue"
          value={`${Math.round(kpis.classifiedRate * 100)}% classe`}
          description={
            compliance.needsReviewCount > 0
              ? `${compliance.needsReviewCount} produit(s) a verifier.`
              : "Pret pour declaration."
          }
        />
      </div>

      {/* 2. Centre d'Action / Brouillon */}
      <Card className="glass-card relative overflow-hidden border-border/40 shadow-soft-lg transition-all duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-emerald-50/40 via-white/20 to-transparent" />
        <div className="-mr-20 -mt-20 pointer-events-none absolute top-0 right-0 animate-pulse-slow rounded-full bg-emerald-500/10 p-40 blur-[100px]" />

        <CardContent className="relative z-10 flex flex-col items-center p-8 text-center sm:p-12">
          {!currentMonthDeclaration ? (
            <div className="flex max-w-md flex-col items-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 shadow-sm">
                <FileText className="size-8" />
              </div>
              <h2 className="font-semibold text-2xl text-slate-800">Creez le brouillon de {periodLabel}</h2>
              <p className="mt-2 text-muted-foreground">
                Initiez le brouillon de ce mois pour figer le tonnage, le montant estime et le bareme utilise. Vous
                pourrez le verifier avant soumission.
              </p>
              <Button
                onClick={handleCreateDraft}
                className="hover:-translate-y-0.5 mt-8 bg-emerald-600 px-8 text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
              >
                <Sparkles className="mr-2 size-4" />
                Creer le brouillon
              </Button>
            </div>
          ) : currentMonthDeclaration.status === "SUBMITTED" ? (
            <div className="flex max-w-md flex-col items-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="font-bold text-2xl text-emerald-900">Declaration transmise</h2>
              <p className="mt-2 text-emerald-800/80">
                Votre declaration a bien ete verifiee, validee et transmise a votre eco-organisme.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExport(currentMonthDeclaration.id)}
                  className="bg-white/70"
                >
                  <Download className="mr-2 size-4" />
                  Exporter les donnees
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadCertificate(currentMonthDeclaration)}
                  className="border-emerald-200 bg-white/80 text-emerald-700 shadow-sm hover:bg-white"
                >
                  <FileText className="mr-2 size-4" />
                  Telecharger le Certificat
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-3xl flex-col">
              <div className="mb-8 flex flex-col items-center">
                <Badge variant="outline" className="mb-4 border-amber-200 bg-amber-50 text-amber-700">
                  <Clock3 className="mr-1.5 size-3.5" /> Brouillon en attente de soumission
                </Badge>
                <h2 className="font-bold text-3xl text-slate-800">Verification avant Depot</h2>
                <p className="mt-2 text-muted-foreground">
                  Passez en revue les elements ci-dessous pour garantir la conformite de votre declaration.
                </p>
              </div>

              <div className="space-y-4 text-left">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group hover:-translate-y-0.5 flex cursor-default flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-soft-lg sm:flex-row sm:items-center sm:justify-between",
                      item.done ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          item.done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
                        )}
                      >
                        {item.done ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-4" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.label}</h4>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </div>
                    {!item.done && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.location.href = item.href;
                        }}
                        className="w-full shrink-0 justify-center font-medium text-amber-700 hover:bg-amber-100/50 hover:text-amber-800 sm:w-auto"
                      >
                        {item.cta}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center border-border/40 border-t pt-8">
                {isReadyToSubmit ? (
                  <Button
                    onClick={() => handleSubmit(currentMonthDeclaration.id)}
                    size="lg"
                    className="hover:-translate-y-1 h-12 w-full max-w-sm bg-emerald-600 px-8 text-base text-white shadow-xl transition-all hover:bg-emerald-700 hover:shadow-emerald-500/20"
                  >
                    <Send className="mr-2 size-5" />
                    Soumettre la declaration
                  </Button>
                ) : (
                  <div className="flex w-full max-w-sm flex-col items-center">
                    <Button
                      disabled
                      size="lg"
                      className="h-12 w-full truncate bg-slate-100 px-8 text-base text-slate-400"
                    >
                      Soumission bloquee
                    </Button>
                    <p className="mt-3 font-medium text-amber-700 text-sm">
                      {checklist.length - completedChecklistCount} etape(s) requise(s)
                    </p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => handleExport(currentMonthDeclaration.id)}
                  className="mt-4 text-muted-foreground text-sm hover:text-slate-700"
                >
                  <Download className="mr-2 size-4" /> Exporter les donnees pour controle
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle>Historique des declarations</CardTitle>
          <CardDescription>
            Consultez les periodes deja generees, leurs montants estimes et leurs exports associes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-white/20 border-t">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Eco-organisme</TableHead>
                  <TableHead>Tonnage (kg)</TableHead>
                  <TableHead>Montant estime</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="size-8 text-muted-foreground/30" />
                        <p>Aucune declaration generee.</p>
                        <Button variant="link" onClick={handleCreateDraft} className="text-emerald-600">
                          Commencer maintenant
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group relative cursor-default transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-emerald-500 before:opacity-0 hover:bg-emerald-50/40 hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1),inset_0_-1px_0_0_rgba(16,185,129,0.1)] hover:before:opacity-100"
                    >
                      <TableCell className="font-medium">{formatPeriod(item.period)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{item.ecoOrganism}</span>
                          {item.tariffVersionLabel ? (
                            <span className="text-muted-foreground text-xs">{item.tariffVersionLabel}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {item.totalTonnageKg.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {item.estimatedAmountEur.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </TableCell>
                      <TableCell>
                        {item.status === "SUBMITTED" ? (
                          <Badge
                            variant="outline"
                            className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
                          >
                            <CheckCircle2 className="size-3" /> Soumise
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="flex w-fit items-center gap-1 border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
                          >
                            <Clock3 className="size-3" /> Brouillon
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                          {item.status === "SUBMITTED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCertificate(item)}
                              className="h-8 border-emerald-200 bg-white/60 text-emerald-700 text-xs hover:bg-white"
                            >
                              <FileText className="mr-1.5 size-3.5" />
                              Certificat
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(item.id)}
                            className="h-8 bg-white/60 text-xs hover:bg-white"
                          >
                            <Download className="mr-1.5 size-3.5" />
                            CSV
                          </Button>
                          {item.status === "DRAFT" ? (
                            <Button
                              size="sm"
                              onClick={() => handleSubmit(item.id)}
                              className="h-8 bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                            >
                              <Send className="mr-1.5 size-3.5" />
                              Soumettre
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UpgradeModalRenderer />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: any;
  description: string;
  icon?: any;
}) {
  return (
    <div className="group hover:-translate-y-1 flex cursor-default flex-col justify-between rounded-2xl border border-border/40 bg-white/60 p-5 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-emerald-200 hover:shadow-soft-lg">
      <div className="flex items-center justify-between">
        <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide transition-colors group-hover:text-emerald-700">
          {title}
        </div>
        {icon && <div className="text-muted-foreground/50 transition-colors group-hover:text-emerald-600">{icon}</div>}
      </div>
      <div className="mt-4 font-bold text-3xl text-slate-800 tracking-tight">{value}</div>
      <div className="mt-1 text-muted-foreground text-sm">{description}</div>
    </div>
  );
}
