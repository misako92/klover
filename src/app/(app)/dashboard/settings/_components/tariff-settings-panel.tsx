"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Database, Loader2, ShieldCheck } from "lucide-react";

import { getTariffWorkspace } from "@/app/actions/tariffs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TariffEcoOrganism, TariffMaterialType, TariffProfileSnapshot } from "@/lib/compliance/tariff-config";

type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

interface TariffWorkspaceResponse {
  currentRole: WorkspaceRole;
  ecoOrganisms: readonly TariffEcoOrganism[];
  materialTypes: readonly TariffMaterialType[];
  profiles: Record<TariffEcoOrganism, TariffProfileSnapshot>;
}

const MATERIAL_LABELS: Record<TariffMaterialType, string> = {
  PLASTIC_PET: "Plastique PET",
  PLASTIC: "Plastique",
  CARDBOARD: "Carton / papier",
  GLASS: "Verre",
  ALUMINUM: "Aluminium",
  STEEL: "Acier",
  WOOD: "Bois",
  TEXTILE: "Textile",
  COMPOSITE: "Composite",
  UNKNOWN: "Inconnu",
};

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Non definie";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    dateStyle: "medium",
  });
}

function formatRate(value: number) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TariffSettingsPanel() {
  const [workspace, setWorkspace] = useState<TariffWorkspaceResponse | null>(null);
  const [selectedOrganism, setSelectedOrganism] = useState<TariffEcoOrganism>("CITEO");

  const loadWorkspace = useCallback(async () => {
    const response = (await getTariffWorkspace()) as TariffWorkspaceResponse;
    setWorkspace(response);
    if (!response.profiles[selectedOrganism]) {
      setSelectedOrganism(response.ecoOrganisms[0]);
    }
  }, [selectedOrganism]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedProfile = useMemo(() => {
    if (!workspace) {
      return null;
    }

    return workspace.profiles[selectedOrganism] ?? workspace.profiles[workspace.ecoOrganisms[0]];
  }, [selectedOrganism, workspace]);

  if (!workspace || !selectedProfile) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Chargement des baremes...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            Baremes officiels
          </CardTitle>
          <CardDescription>
            Les baremes affiches sont fournis et maintenus par Klover. Ils sont utilises en lecture seule pour vos
            calculs, declarations et exports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <label htmlFor="tariff-organism" className="font-medium text-sm">
              Eco-organisme
            </label>
            <Select value={selectedOrganism} onValueChange={(value) => setSelectedOrganism(value as TariffEcoOrganism)}>
              <SelectTrigger id="tariff-organism">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspace.ecoOrganisms.map((ecoOrganism) => (
                  <SelectItem key={ecoOrganism} value={ecoOrganism}>
                    {ecoOrganism}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4 text-sm md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-muted-foreground">Version active</div>
              <div className="font-medium">{selectedProfile.versionLabel}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Source</div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedProfile.source === "database" ? "default" : "outline"}>
                  {selectedProfile.source === "database" ? "Publiee par Klover" : "Fallback embarque"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Date d'effet</div>
              <div className="font-medium">{formatDateLabel(selectedProfile.effectiveFrom)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Derniere mise a jour</div>
              <div className="font-medium">
                {formatDateLabel(selectedProfile.updatedAt ?? selectedProfile.effectiveFrom)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5 text-emerald-600" />
            Parametres de calcul
          </CardTitle>
          <CardDescription>
            Les remises de reemploi et les tarifs par matiere sont figes par version, puis snapshots dans chaque
            declaration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col p-2 pt-0 md:p-6 md:pt-0">
          <div className="group flex flex-col justify-between gap-4 border-border/40 border-b px-2 py-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">
                Decote par rotation
              </div>
              <div className="text-muted-foreground text-sm">Reduction appliquee par cycle de reemploi</div>
            </div>
            <div className="font-medium text-sm">{selectedProfile.config.reusableDiscountPerReusePct}%</div>
          </div>
          <div className="group flex flex-col justify-between gap-4 border-border/40 border-b px-2 py-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">
                Plafond reemploi
              </div>
              <div className="text-muted-foreground text-sm">Limite maximale de la decote cumulable</div>
            </div>
            <div className="font-medium text-sm">{selectedProfile.config.reusableDiscountCapPct}%</div>
          </div>
          <div className="group flex flex-col justify-between gap-4 px-2 py-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-foreground transition-colors group-hover:text-emerald-800">
                Notes de version
              </div>
              <div className="text-muted-foreground text-sm">
                {selectedProfile.notes ?? "Aucune note interne exposee."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tarifs par matiere</CardTitle>
          <CardDescription>Montants en EUR/kg. Primaire = menager, secondaire/tertiaire = pro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Faites defiler horizontalement sur mobile pour comparer les tarifs par matiere.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matiere</TableHead>
                <TableHead>Primaire</TableHead>
                <TableHead>Pro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.materialTypes.map((materialType) => (
                <TableRow
                  key={materialType}
                  className="group relative cursor-default transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-emerald-500 before:opacity-0 hover:bg-emerald-50/40 hover:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.1),inset_0_-1px_0_0_rgba(16,185,129,0.1)] hover:before:opacity-100"
                >
                  <TableCell className="font-medium transition-colors group-hover:text-emerald-800">
                    {MATERIAL_LABELS[materialType]}
                  </TableCell>
                  <TableCell>{formatRate(selectedProfile.config.primaryEurPerKg[materialType])}</TableCell>
                  <TableCell>{formatRate(selectedProfile.config.proEurPerKg[materialType])}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
