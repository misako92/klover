"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function TemplateDownloadButton() {
  const handleDownload = () => {
    const csvContent = [
      "nom_produit;sku;quantite_vendue",
      "T-Shirt Coton Bio;SKU-001;250",
      "Mug Ceramique 300ml;SKU-002;180",
      "Bouteille PET 500ml;SKU-003;500",
      "Boite Carton 30x20;SKU-004;320",
      "Sac Papier Kraft;SKU-005;420",
    ].join("\r\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele_import_klover.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Modele CSV telecharge.");
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleDownload}>
      <Download className="size-4" />
      Modele CSV
    </Button>
  );
}
