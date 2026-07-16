"use client";

import * as React from "react";

import { AlertCircle, Calculator, CheckCircle2, Package, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { calculateCoopContribution } from "@/services/contribution";

import type { ClassificationStatus, Product } from "./columns";

interface ProductSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedProduct: Product) => void;
}

type UiMaterialType = "PLASTIC_PET" | "CARDBOARD" | "GLASS" | "ALUMINUM";
type UiEcoOrganism = "CITEO" | "LEKO" | "ECOMAISON" | "VALDELIA" | "OTHER";
type UiPackagingType = "PRIMARY" | "SECONDARY" | "TERTIARY";

export function ProductSheet({ product, open, onOpenChange, onSave }: ProductSheetProps) {
  const { updateProductClassification, db } = useComplianceData();
  const [weight, setWeight] = React.useState("");
  const [material, setMaterial] = React.useState<UiMaterialType | "">("");
  const [organism, setOrganism] = React.useState<UiEcoOrganism | "">("");
  const [packagingType, setPackagingType] = React.useState<UiPackagingType>("PRIMARY");
  const [isReusable, setIsReusable] = React.useState(false);
  const [reuseCount, setReuseCount] = React.useState("1");
  const [fee, setFee] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);

  const selectedTariffProfile = organism ? db.settings.tariffProfiles?.[organism] : undefined;

  React.useEffect(() => {
    if (!product) {
      return;
    }

    setWeight(product.weightG?.toString() || "");
    setMaterial((product.materialType as UiMaterialType) || "");
    setOrganism((product.ecoOrganism as UiEcoOrganism) || "CITEO");
    setPackagingType((product.packagingType as UiPackagingType) || "PRIMARY");
    setIsReusable(Boolean(product.isReusable));
    setReuseCount(product.reuseCount?.toString() || "1");
  }, [product]);

  React.useEffect(() => {
    if (!weight || !material || !organism) {
      setFee(0);
      return;
    }

    const parsedWeight = Number.parseFloat(weight);
    if (Number.isNaN(parsedWeight)) {
      setFee(0);
      return;
    }

    setFee(
      calculateCoopContribution(
        parsedWeight,
        material,
        organism,
        packagingType,
        isReusable,
        Number.parseInt(reuseCount, 10) || 1,
        selectedTariffProfile,
      ),
    );
  }, [weight, material, organism, packagingType, isReusable, reuseCount, selectedTariffProfile]);

  const handleSave = async () => {
    if (!product) {
      return;
    }

    if (!weight || !material || !organism) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const parsedWeight = Number.parseFloat(weight);
    if (Number.isNaN(parsedWeight)) {
      toast.error("Poids invalide.");
      return;
    }

    const updated: Product = {
      ...product,
      weightG: parsedWeight,
      materialType: material,
      ecoOrganism: organism,
      packagingType,
      isReusable,
      reuseCount: Number.parseInt(reuseCount, 10) || 0,
      status: "CONFIRMED" as ClassificationStatus,
    };

    setIsSaving(true);
    try {
      await updateProductClassification({
        productId: product.id,
        materialType: material,
        ecoOrganism: organism,
        packagingType,
        isReusable,
        reuseCount: Number.parseInt(reuseCount, 10) || 0,
        weightG: parsedWeight,
        confidence: 0.95,
      });
      onSave(updated);
      onOpenChange(false);
      toast.success("Produit classifie avec succes !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-[540px]">
        <SheetHeader className="border-b bg-muted/40 px-6 py-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant={product.status === "CONFIRMED" ? "default" : "secondary"}
              className={product.status === "CONFIRMED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {product.status === "CONFIRMED" ? "Valide" : "A traiter"}
            </Badge>
            <span className="font-mono text-muted-foreground/70 text-xs">{product.sku}</span>
          </div>
          <SheetTitle className="text-xl">{product.name}</SheetTitle>
          <SheetDescription>Configurez les donnees techniques pour calculer l'eco-contribution.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm uppercase tracking-wider">
                <AlertCircle className="size-4 text-muted-foreground/70" />
                Informations produit
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="mb-1 block text-muted-foreground text-xs">SKU</span>
                  <span className="font-medium font-mono text-foreground">{product.sku}</span>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="mb-1 block text-muted-foreground text-xs">Libelle</span>
                  <span className="truncate font-medium text-foreground" title={product.name}>
                    {product.name}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-5">
              <h3 className="flex items-center gap-2 font-semibold text-emerald-700 text-sm uppercase tracking-wider">
                <Calculator className="size-4" />
                Classification AGEC
              </h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="organism">Eco-organisme</Label>
                  <Select value={organism} onValueChange={(value) => setOrganism(value as UiEcoOrganism)}>
                    <SelectTrigger id="organism">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CITEO">CITEO</SelectItem>
                      <SelectItem value="LEKO">Leko</SelectItem>
                      <SelectItem value="ECOMAISON">Ecomaison</SelectItem>
                      <SelectItem value="VALDELIA">Valdelia</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="material">Materiau principal</Label>
                    <Select value={material} onValueChange={(value) => setMaterial(value as UiMaterialType)}>
                      <SelectTrigger id="material">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLASTIC_PET">Plastique (PET)</SelectItem>
                        <SelectItem value="CARDBOARD">Carton / Papier</SelectItem>
                        <SelectItem value="GLASS">Verre</SelectItem>
                        <SelectItem value="ALUMINUM">Aluminium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="weight">Poids unitaire (g)</Label>
                    <div className="relative">
                      <Input
                        id="weight"
                        type="number"
                        placeholder="ex: 120"
                        className="pr-8"
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                      />
                      <span className="-translate-y-1/2 absolute top-1/2 right-3 font-medium text-muted-foreground/70 text-xs">
                        g
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-5">
              <h3 className="flex items-center gap-2 font-semibold text-blue-700 text-sm uppercase tracking-wider">
                <Package className="size-4" />
                Format de l'emballage
              </h3>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pkg_type">Type d'emballage</Label>
                  <Select value={packagingType} onValueChange={(value) => setPackagingType(value as UiPackagingType)}>
                    <SelectTrigger id="pkg_type">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIMARY">Primaire</SelectItem>
                      <SelectItem value="SECONDARY">Secondaire</SelectItem>
                      <SelectItem value="TERTIARY">Tertiaire</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Les emballages secondaires et tertiaires ont des baremes REP dedies.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reusable">Concu pour le reemploi ?</Label>
                    <Select value={isReusable ? "yes" : "no"} onValueChange={(value) => setIsReusable(value === "yes")}>
                      <SelectTrigger id="reusable">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Non</SelectItem>
                        <SelectItem value="yes">Oui</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isReusable && (
                    <div className="grid gap-2">
                      <Label htmlFor="reuseCount">Nombre de rotations</Label>
                      <Input
                        id="reuseCount"
                        type="number"
                        placeholder="ex: 5"
                        value={reuseCount}
                        onChange={(event) => setReuseCount(event.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-slate-900 p-5 text-white shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                <Calculator className="-rotate-12 size-24" />
              </div>

              <div className="relative z-10">
                <div className="mb-2 font-medium text-white/60 text-xs uppercase tracking-wider">
                  Estimation du cout
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-4xl tracking-tight">{(fee / 100).toFixed(4)}</span>
                  <span className="text-emerald-400 text-lg">EUR</span>
                  <span className="ml-2 text-sm text-white/60">/ unite HT</span>
                </div>

                {material && weight && (
                  <div className="mt-4 flex flex-col gap-2 border-white/10 border-t pt-4 text-white/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span>
                        Base sur le bareme {selectedTariffProfile?.versionLabel ?? `${organism} 2026`} (
                        {packagingType === "PRIMARY" ? "Menager" : "Pro"})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        Calcul conforme
                      </span>
                    </div>
                    {isReusable && (
                      <div className="flex items-center justify-between text-emerald-300">
                        <span>Prime au reemploi appliquee</span>
                        <span>-{Math.min((Number.parseInt(reuseCount, 10) || 1) * 5, 50)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t bg-muted/40 p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Save className="size-4" />
            Enregistrer la classification
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
