"use client";

import * as React from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRightLeft,
  DatabaseZap,
  FileText,
  Globe,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useSubscription } from "@/components/subscription/subscription-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { validateIDU } from "@/lib/compliance-utils";

import { TariffSettingsPanel } from "./_components/tariff-settings-panel";
import { TeamSettingsPanel } from "./_components/team-settings-panel";

export default function SettingsPage() {
  const { db, declarations, compliance, isMockMode, resetMockData, saveIdu } = useComplianceData();
  const subscription = useSubscription();
  const [activeTab, setActiveTab] = React.useState("workspace");
  const [iduInput, setIduInput] = React.useState(db.settings?.idu || "");
  const [isSavingIdu, setIsSavingIdu] = React.useState(false);

  React.useEffect(() => {
    setIduInput(db.settings?.idu || "");
  }, [db.settings?.idu]);

  const handleReset = () => {
    resetMockData();
    toast.success("Données de démo réinitialisées.");
  };

  const handleSaveIdu = async () => {
    if (!iduInput) {
      toast.error("Veuillez entrer un numéro IDU.");
      return;
    }

    if (!validateIDU(iduInput)) {
      toast.error("Format d'IDU invalide. Format attendu : FR123456_01ABCD");
      return;
    }

    setIsSavingIdu(true);
    try {
      await saveIdu(iduInput);
      toast.success("IDU enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde de l'IDU.");
    } finally {
      setIsSavingIdu(false);
    }
  };

  const submittedDeclarationsCount = declarations.filter((item) => item.status === "SUBMITTED").length;
  const draftDeclarationsCount = declarations.filter((item) => item.status === "DRAFT").length;
  const hasIdu = Boolean(db.settings?.idu);

  return (
    <div className="stagger-1 container mx-auto max-w-6xl animate-enter space-y-8 py-8">
      <div className="flex flex-col gap-4 border-border/40 border-b pb-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 text-xs">
            <ShieldCheck className="size-3.5" />
            Hub de configuration
          </div>
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">Paramètres</h1>
            <p className="max-w-2xl text-muted-foreground">
              Gérez les préférences, la conformité, l'équipe et les facturations de votre organisation.
            </p>
          </div>
        </div>
      </div>

      <Tabs
        orientation="vertical"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex w-full flex-col gap-8 md:flex-row lg:gap-12"
      >
        {/* SIDEBAR NAVIGATION */}
        <div className="flex w-full shrink-0 flex-col md:w-56">
          <TabsList className="flex h-auto w-full flex-col items-start justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="workspace"
              className="w-full justify-start rounded-lg px-4 py-2.5 text-left text-slate-600 text-sm transition-all hover:bg-slate-100/60 hover:text-slate-900 data-[state=active]:border data-[state=active]:border-emerald-100 data-[state=active]:bg-white/80 data-[state=active]:font-medium data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Espace de travail
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="w-full justify-start rounded-lg px-4 py-2.5 text-left text-slate-600 text-sm transition-all hover:bg-slate-100/60 hover:text-slate-900 data-[state=active]:border data-[state=active]:border-emerald-100 data-[state=active]:bg-white/80 data-[state=active]:font-medium data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Conformité
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="w-full justify-start rounded-lg px-4 py-2.5 text-left text-slate-600 text-sm transition-all hover:bg-slate-100/60 hover:text-slate-900 data-[state=active]:border data-[state=active]:border-emerald-100 data-[state=active]:bg-white/80 data-[state=active]:font-medium data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Équipe
            </TabsTrigger>
            <TabsTrigger
              value="connectors"
              className="w-full justify-start rounded-lg px-4 py-2.5 text-left text-slate-600 text-sm transition-all hover:bg-slate-100/60 hover:text-slate-900 data-[state=active]:border data-[state=active]:border-emerald-100 data-[state=active]:bg-white/80 data-[state=active]:font-medium data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Connecteurs
            </TabsTrigger>
            <TabsTrigger
              value="developer"
              className="w-full justify-start rounded-lg px-4 py-2.5 text-left text-slate-600 text-sm transition-all hover:bg-slate-100/60 hover:text-slate-900 data-[state=active]:border data-[state=active]:border-emerald-100 data-[state=active]:bg-white/80 data-[state=active]:font-medium data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
            >
              Développeurs API
            </TabsTrigger>
          </TabsList>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="min-w-0 flex-1">
          <TabsContent
            value="workspace"
            className="fade-in slide-in-from-right-4 mt-0 animate-in space-y-8 duration-500"
          >
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Espace de travail</CardTitle>
                  <CardDescription>
                    Ce panneau rassemble les informations de base utiles à l'exploitation quotidienne.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col p-2 pt-0 sm:p-6 sm:pt-0">
                  <WorkspaceInfoCard
                    title="Plan actif"
                    value={subscription.name}
                    description="La facturation reste gérée depuis la page dédiée."
                  />
                  <WorkspaceInfoCard
                    title="Mode de données"
                    value={isMockMode ? "Demo" : "Serveur"}
                    description={
                      isMockMode
                        ? "Des fonctions de réinitialisation sont exposées uniquement en démo."
                        : "Le dashboard s'appuie sur Prisma et Supabase."
                    }
                  />
                  <WorkspaceInfoCard
                    title="Déclarations"
                    value={`${submittedDeclarationsCount} soumise(s)`}
                    description={
                      draftDeclarationsCount > 0
                        ? `${draftDeclarationsCount} brouillon(s) en cours`
                        : "Aucun brouillon en attente"
                    }
                  />
                  <WorkspaceInfoCard
                    title="API"
                    value={subscription.features.apiAccess ? "Droit présent" : "Non inclus"}
                    description="Le provisioning n'est pas encore exposé dans l'interface."
                  />
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-border/40 border-t bg-muted/10 pt-4">
                  <Button asChild variant="outline" className="bg-white/70">
                    <Link href="/dashboard/billing">
                      <FileText className="mr-2 size-4" />
                      Ouvrir la facturation
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-white/70">
                    <Link href="/dashboard/activity">
                      <ShieldCheck className="mr-2 size-4" />
                      Voir l'activité
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>IDU organisation</CardTitle>
                  <CardDescription>
                    Utilisé dans les exports et contrôles internes. Ce champ doit être maintenu à jour.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idu">Numéro Identifiant Unique (IDU)</Label>
                    <Input
                      id="idu"
                      placeholder="FR123456_01ABCD"
                      value={iduInput}
                      onChange={(event) => setIduInput(event.target.value)}
                      className="max-w-md bg-white/50"
                    />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-muted-foreground text-sm">
                    {hasIdu
                      ? "L'IDU actuel est déjà enregistré dans l'organisation."
                      : "Aucun IDU n'est encore enregistré pour cette organisation."}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 border-border/40 border-t bg-muted/10 pt-4">
                  <Button onClick={handleSaveIdu} disabled={isSavingIdu}>
                    {isSavingIdu ? "Sauvegarde..." : "Enregistrer"}
                  </Button>
                  <Button asChild variant="outline" className="bg-white/70">
                    <Link href="/dashboard/declarations">Voir les déclarations</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {isMockMode ? (
              <Card className="glass-card border-red-100 bg-red-50/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="size-5" />
                    Zone de démo
                  </CardTitle>
                  <CardDescription>Disponible uniquement en environnement de démonstration.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 rounded-lg border border-red-200 bg-red-50/50 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-red-900">Réinitialiser les données de démo</p>
                      <p className="text-red-700/80 text-sm">
                        Efface les produits et les indicateurs mock stockés localement.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleReset}>
                      <RefreshCcw className="mr-2 size-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent
            value="compliance"
            className="fade-in slide-in-from-right-4 mt-0 animate-in space-y-8 duration-500"
          >
            <div className="flex flex-col rounded-xl border border-border/40 bg-white/30 p-2 backdrop-blur-md">
              <WorkspaceInfoCard
                title="IDU"
                value={hasIdu ? "Renseigné" : "Manquant"}
                description={hasIdu ? "Prêt pour les exports et contrôles" : "Ajoutez-le dans l'onglet Espace"}
              />
              <WorkspaceInfoCard
                title="Catalogue"
                value={compliance.needsReviewCount > 0 ? "À compléter" : "Prêt"}
                description={
                  compliance.needsReviewCount > 0
                    ? `${compliance.needsReviewCount} produit(s) à vérifier`
                    : "Aucun blocage catalogue détecté"
                }
              />
              <WorkspaceInfoCard
                title="Déclarations"
                value={`${draftDeclarationsCount} brouillon(s)`}
                description="Les barèmes snapshots s'appliquent déclaration par déclaration."
              />
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Portails éco-organismes</CardTitle>
                <CardDescription>
                  Les accès portail et références internes des éco-organismes se pilotent depuis un écran dédié.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col p-2 pt-0 sm:p-6 sm:pt-0">
                <ConnectorSummaryCard
                  title="Portails éco-organismes"
                  description="CITEO, Leko, Ecomaison, Valdelia et autres organismes sont centralisés dans une page dédiée."
                  badge="Configuration"
                  href="/dashboard/eco-organismes"
                  ctaLabel="Ouvrir les portails"
                />
                <ConnectorSummaryCard
                  title="Cycle déclaratif"
                  description="Retrouvez les brouillons, exports et certificats sur la page Déclarations."
                  badge="Opérations"
                  href="/dashboard/declarations"
                  ctaLabel="Ouvrir les déclarations"
                />
              </CardContent>
            </Card>

            <TariffSettingsPanel />
          </TabsContent>

          <TabsContent value="team" className="fade-in slide-in-from-right-4 mt-0 animate-in space-y-8 duration-500">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="size-4 text-emerald-600" />
              Le changement d'organisation reste disponible depuis le menu utilisateur.
            </div>
            <TeamSettingsPanel />
          </TabsContent>

          <TabsContent
            value="connectors"
            className="fade-in slide-in-from-right-4 mt-0 animate-in space-y-8 duration-500"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="size-5 text-emerald-600" />
                    Connecteurs e-commerce
                  </CardTitle>
                  <CardDescription>
                    Shopify, WooCommerce et les imports produits/commandes sont gérés sur une page dédiée.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col p-2 pt-0 sm:p-6 sm:pt-0">
                  <ConnectorSummaryCard
                    title="Shopify"
                    description="Connectez une boutique, stockez les credentials et lancez les synchronisations."
                    badge="Disponible"
                    href="/dashboard/integrations"
                    ctaLabel="Configurer Shopify"
                  />
                  <ConnectorSummaryCard
                    title="WooCommerce"
                    description="Connectez un site WooCommerce et importez produits et commandes."
                    badge="Disponible"
                    href="/dashboard/integrations"
                    ctaLabel="Configurer WooCommerce"
                  />
                  <ConnectorSummaryCard
                    title="Import CSV"
                    description="Le canal principal reste disponible pour alimenter le catalogue et les déclarations."
                    badge={db.settings.importSources.csvEnabled ? "Actif" : "Inactif"}
                    href="/dashboard/orders"
                    ctaLabel="Ouvrir l'import"
                  />
                  <ConnectorSummaryCard
                    title="Portails éco-organismes"
                    description="Les accès de déclaration et références internes sont pilotables à part."
                    badge="Séparation claire"
                    href="/dashboard/eco-organismes"
                    ctaLabel="Ouvrir les portails"
                  />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Architecture des connecteurs</CardTitle>
                  <CardDescription>
                    Klover distingue les flux e-commerce et les portails conformité pour éviter les écrans hybrides.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="font-medium text-foreground">E-commerce</div>
                    <p className="mt-1">
                      Les connecteurs Shopify et WooCommerce importent produits et commandes et alimentent le catalogue.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="font-medium text-foreground">Conformité</div>
                    <p className="mt-1">
                      Les portails éco-organismes centralisent les accès et références internes utilisés pour vos
                      dépôts.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="font-medium text-foreground">Imports CSV</div>
                    <p className="mt-1">
                      Le CSV reste le chemin de secours ou le canal principal quand aucun connecteur n'est branché.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="developer"
            className="fade-in slide-in-from-right-4 mt-0 animate-in space-y-8 duration-500"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseZap className="size-5 text-emerald-600" />
                  API et exposition technique
                </CardTitle>
                <CardDescription>
                  État actuel des droits API et des surfaces techniques visibles pour votre plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                      <Globe className="size-4 text-emerald-600" />
                      Accès API
                    </div>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {subscription.features.apiAccess
                        ? "Le droit d'accès API est présent dans votre plan, mais la génération de clés n'est pas encore exposée dans l'interface."
                        : "L'accès API n'est pas inclus dans votre plan actuel."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      Gouvernance
                    </div>
                    <p className="mt-2 text-muted-foreground text-sm">
                      Les rôles d'organisation, les invitations équipe et les barèmes restent contrôlés côté serveur.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/80 p-6">
                  <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Statut actuel</div>
                  <div className="mt-2 font-semibold text-foreground text-lg">
                    {subscription.features.apiAccess ? "Droit présent, provisioning absent" : "API non incluse"}
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Si vous exposez l'API plus tard, gardez la même logique que le reste du produit: accès bornés par
                    organisation et contrat de surface explicite.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">Plan actuel : {subscription.name}</Badge>
                    {subscription.features.apiAccess ? <Badge variant="outline">Provisioning à venir</Badge> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function _SettingsOverviewCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="group hover:-translate-y-0.5 cursor-default rounded-2xl border border-border/40 bg-white/60 p-4 shadow-soft backdrop-blur-md transition-all duration-300 hover:border-emerald-200 hover:shadow-soft-lg">
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide transition-colors group-hover:text-emerald-700">
        {title}
      </div>
      <div className="mt-2 font-semibold text-foreground text-lg">{value}</div>
      <div className="mt-1 text-muted-foreground text-sm">{description}</div>
    </div>
  );
}

function WorkspaceInfoCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="group flex flex-col justify-between gap-4 border-border/40 border-b px-2 py-4 transition-colors last:border-0 hover:bg-slate-50/50 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <div className="flex-shrink-0">
        <div className="font-medium text-sm">{value}</div>
      </div>
    </div>
  );
}

function ConnectorSummaryCard({
  title,
  description,
  badge,
  href,
  ctaLabel,
}: {
  title: string;
  description: string;
  badge: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <div className="group flex flex-col justify-between gap-6 border-border/40 border-b px-2 py-5 transition-colors last:border-0 hover:bg-slate-50/50 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">{title}</div>
          <Badge variant="outline" className="bg-white/50 font-normal text-muted-foreground text-xs">
            {badge}
          </Badge>
        </div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <div className="flex-shrink-0">
        <Button
          asChild
          variant="outline"
          className="bg-white/70 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
