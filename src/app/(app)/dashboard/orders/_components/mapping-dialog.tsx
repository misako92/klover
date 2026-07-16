"use client";

import * as React from "react";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImportMapping } from "@/types/mock-import";

interface MappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mapping: ImportMapping) => void;
  fileName: string;
  headers: string[];
}

export function MappingDialog({ open, onOpenChange, onConfirm, fileName, headers }: MappingDialogProps) {
  const [mapping, setMapping] = React.useState<ImportMapping>({
    name: "",
    sku: "",
    quantity: "",
  });

  // Auto-map if headers match specific keywords
  React.useEffect(() => {
    if (open && headers.length > 0) {
      const newMapping = { ...mapping };
      headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes("nom") || lower.includes("product") || lower.includes("libelle")) newMapping.name = h;
        else if (lower.includes("sku") || lower.includes("ref") || lower.includes("code")) newMapping.sku = h;
        else if (lower.includes("qte") || lower.includes("qty") || lower.includes("quant")) newMapping.quantity = h;
      });
      setMapping(newMapping);
    }
  }, [open, headers, mapping]);

  const handleConfirm = () => {
    if (!mapping.name || !mapping.sku || !mapping.quantity) {
      toast.error("Veuillez mapper les 3 champs obligatoires (Nom, SKU, Quantité)");
      return;
    }

    // Check for duplicates
    const values = Object.values(mapping);
    const uniqueValues = new Set(values);
    if (values.length !== uniqueValues.size) {
      toast.error("Chaque colonne du fichier ne peut être mappée qu'une seule fois.");
      return;
    }

    onConfirm(mapping);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mapper les colonnes</DialogTitle>
          <DialogDescription>
            Confirmez la correspondance des colonnes pour le fichier{" "}
            <span className="font-medium text-emerald-700">{fileName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-medium">
              Nom du produit
            </Label>
            <Select value={mapping.name} onValueChange={(val) => setMapping({ ...mapping, name: val })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une colonne" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right font-medium">
              SKU
            </Label>
            <Select value={mapping.sku} onValueChange={(val) => setMapping({ ...mapping, sku: val })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une colonne" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right font-medium">
              Quantité vendue
            </Label>
            <Select value={mapping.quantity} onValueChange={(val) => setMapping({ ...mapping, quantity: val })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une colonne" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Check className="mr-2 h-4 w-4" />
            Confirmez le mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
