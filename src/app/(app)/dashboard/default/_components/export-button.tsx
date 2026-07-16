"use client";

import { useState } from "react";

import { CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { exportData } from "@/app/actions/export";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExportButton() {
  const { guard, UpgradeModalRenderer } = usePlanGuard();
  const [open, setOpen] = useState(false);
  const [organism, setOrganism] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [lastRowCount, setLastRowCount] = useState<number | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !guard("canExport", "L'export de donnees")) {
      return;
    }
    setOpen(nextOpen);
    if (!nextOpen) {
      setDone(false);
      setLastRowCount(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportData(organism === "all" ? undefined : organism);
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastRowCount(result.rowCount);
      setDone(true);
      toast.success(
        result.rowCount > 1 ? `${result.rowCount} lignes export\u00e9es.` : `${result.rowCount} ligne export\u00e9e.`,
      );

      setTimeout(() => {
        setDone(false);
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("L'export CSV a \u00e9chou\u00e9.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 font-medium text-sm shadow-sm">
          <Download className="mr-2 size-3.5" />
          Exporter CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Exporter le catalogue CSV
          </DialogTitle>
          <DialogDescription>
            {
              "Exporte les produits confirm\u00e9s de votre organisation dans un CSV consolid\u00e9 pour relecture ou d\u00e9p\u00f4t externe."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={organism} onValueChange={setOrganism}>
            <SelectTrigger>
              <SelectValue placeholder={"\u00c9co-organisme"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{"Tous les \u00e9co-organismes"}</SelectItem>
              <SelectItem value="CITEO">CITEO</SelectItem>
              <SelectItem value="ECOMAISON">Ecomaison</SelectItem>
              <SelectItem value="LEKO">Leko</SelectItem>
              <SelectItem value="VALDELIA">Valdelia</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-muted-foreground text-xs">
            {"Le fichier utilise le s\u00e9parateur "}
            <span className="font-mono">;</span>
            {
              " et inclut les colonnes m\u00e9tier utiles \u00e0 la relecture. Seuls les produits confirm\u00e9s sont export\u00e9s."
            }
          </p>
        </div>
        <DialogFooter>
          {done ? (
            <Button disabled className="gap-2 bg-emerald-600">
              <CheckCircle2 className="size-4" />
              {lastRowCount != null
                ? `${lastRowCount} ligne${lastRowCount > 1 ? "s" : ""} export\u00e9e${lastRowCount > 1 ? "s" : ""}`
                : "Export termin\u00e9"}
            </Button>
          ) : (
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="size-4" />
              {exporting ? "G\u00e9n\u00e9ration du CSV..." : "T\u00e9l\u00e9charger le CSV"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <UpgradeModalRenderer />
    </>
  );
}
