"use client";

import { useMemo, useState } from "react";

import { CheckCircle2, FileSpreadsheet, RefreshCw, ShoppingBag, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";

function formatLastImportDate(dateString?: string) {
  if (!dateString) {
    return "Aucun import";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Aucun import";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SyncStatusWidget() {
  const { imports, products, refresh } = useComplianceData();
  const [isSyncing, setIsSyncing] = useState(false);

  const latestImport = imports[0];
  const productCount = products.length;
  const lastImportDate = useMemo(() => formatLastImportDate(latestImport?.importedAt), [latestImport?.importedAt]);

  const handleSync = () => {
    setIsSyncing(true);
    refresh();
    window.setTimeout(() => {
      setIsSyncing(false);
      toast.success("Donnees rafraichies");
    }, 600);
  };

  return (
    <Card className="flex shrink-0 flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-base">Etat de synchronisation</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("size-4", isSyncing && "animate-spin text-emerald-600")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                <ShoppingBag className="size-5 text-slate-400" />
              </div>
              <div className="-bottom-1 -right-1 absolute rounded-full bg-white p-0.5">
                <XCircle className="size-4 fill-white text-slate-400" />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">Boutique Shopify</p>
              <p className="text-muted-foreground text-xs">Non connecte - utilisez l'import CSV</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                <FileSpreadsheet className="size-5 text-emerald-600" />
              </div>
              <div className="-bottom-1 -right-1 absolute rounded-full bg-white p-0.5">
                {productCount > 0 ? (
                  <CheckCircle2 className="size-4 fill-white text-emerald-500" />
                ) : (
                  <XCircle className="size-4 fill-white text-slate-400" />
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">Import CSV</p>
              <p className="text-muted-foreground text-xs">
                {productCount > 0 ? `${productCount} produits importes` : "Aucun import effectue"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-border/50 border-t pt-4 text-xs">
          <span className="text-muted-foreground">Derniere mise a jour : {lastImportDate}</span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 font-medium",
              productCount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
            )}
          >
            <div
              className={cn(
                "size-1.5 rounded-full",
                productCount > 0 ? "animate-pulse bg-emerald-500" : "bg-amber-500",
              )}
            />
            {productCount > 0 ? "Operationnel" : "En attente de donnees"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
