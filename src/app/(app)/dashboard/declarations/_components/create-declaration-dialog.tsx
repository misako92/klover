"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createDeclaration } from "@/app/actions/declarations";
import { usePlanGuard } from "@/components/subscription/use-plan-guard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EcoOrganism = "CITEO" | "LEKO" | "ECOMAISON" | "VALDELIA";

export function CreateDeclarationDialog() {
  const router = useRouter();
  const { guard, UpgradeModalRenderer } = usePlanGuard();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [ecoOrganism, setEcoOrganism] = React.useState<EcoOrganism>("CITEO");
  const [month, setMonth] = React.useState<string>(() => format(new Date(), "yyyy-MM"));

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const [yearStr, monthStr] = month.split("-");
        const year = Number(yearStr);
        const monthIndex = Number(monthStr) - 1;
        const date = new Date(Date.UTC(year, monthIndex, 1));
        await createDeclaration(date, ecoOrganism);
        setOpen(false);
        toast.success("Déclaration créée avec succès");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
      }
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (nextOpen && !guard("canExport", "La creation de declarations")) return;
      setOpen(nextOpen);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="size-4" />
          Nouvelle déclaration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle déclaration</DialogTitle>
          <DialogDescription>
            Générez une déclaration pour une période donnée. Cela figera les calculs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="organism" className="text-right">
              Organisme
            </Label>
            <Select value={ecoOrganism} onValueChange={(value) => setEcoOrganism(value as EcoOrganism)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CITEO">CITEO</SelectItem>
                <SelectItem value="LEKO">LÉKO</SelectItem>
                <SelectItem value="ECOMAISON">EcoMaison</SelectItem>
                <SelectItem value="VALDELIA">Valdelia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Période
            </Label>
            <input
              type="month"
              id="month"
              className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <UpgradeModalRenderer />
    </>
  );
}
