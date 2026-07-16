"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { cn } from "@/lib/utils";
import type { ImportMapping } from "@/types/mock-import";

import { MappingDialog } from "./mapping-dialog";

export function UploadZone() {
  const router = useRouter();
  const { runImport } = useComplianceData();
  const maxBytes = 10 * 1024 * 1024;
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [showMapping, setShowMapping] = React.useState(false);
  const [csvText, setCsvText] = React.useState("");
  const [parsedRowCount, setParsedRowCount] = React.useState(0);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (selectedFile: File) => {
    const isCsv = selectedFile.type === "text/csv" || selectedFile.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      toast.error("Format non supporte. Veuillez utiliser un fichier .csv");
      return;
    }

    if (selectedFile.size > maxBytes) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(10);

    const nextCsvText = await selectedFile.text();
    setCsvText(nextCsvText);

    Papa.parse<Record<string, string>>(nextCsvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setProgress(40);
        const data = Array.isArray(results.data) ? results.data : [];
        if (data.length === 0) {
          toast.error("Le fichier semble vide.");
          setIsProcessing(false);
          return;
        }

        setParsedRowCount(data.length);
        const keys = Object.keys(data[0] ?? {});
        setHeaders(keys);

        const lowerKeys = keys.map((key) => key.toLowerCase());
        const hasSku = lowerKeys.some((key) => key.includes("sku") || key.includes("ref") || key.includes("code"));
        const hasName = lowerKeys.some((key) => key.includes("name") || key.includes("nom") || key.includes("libelle"));

        if (!hasSku || !hasName) {
          setIsProcessing(false);
          setShowMapping(true);
          return;
        }

        const defaultMapping: ImportMapping = {
          sku: keys.find((key) => key.toLowerCase().includes("sku") || key.toLowerCase().includes("ref")) || "sku",
          name: keys.find((key) => key.toLowerCase().includes("name") || key.toLowerCase().includes("nom")) || "name",
          quantity:
            keys.find((key) => key.toLowerCase().includes("qty") || key.toLowerCase().includes("qte")) || "quantity",
        };

        window.setTimeout(() => {
          setProgress(100);
          void finalizeImport(defaultMapping);
        }, 500);
      },
      error: (error: Error) => {
        toast.error(`Erreur de lecture CSV: ${error.message}`);
        setIsProcessing(false);
      },
    });
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      void processFile(droppedFile);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      void processFile(selectedFile);
    }
  };

  const finalizeImport = async (mapping: ImportMapping) => {
    if (!file || !csvText) {
      toast.error("Aucun fichier disponible.");
      setIsProcessing(false);
      return;
    }

    try {
      setProgress(80);
      await runImport({
        fileName: file.name,
        csvText,
        mapping,
      });
      toast.success(`${parsedRowCount} lignes importees avec succes !`);
      window.setTimeout(() => {
        router.push("/dashboard/products");
      }, 600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'import.");
      setIsProcessing(false);
      setProgress(0);
      return;
    }

    setIsProcessing(false);
  };

  return (
    <>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ease-in-out hover:border-emerald-500 hover:bg-emerald-50/10",
          isDragging ? "scale-[1.01] border-emerald-500 bg-emerald-50/20" : "border-border bg-muted/40",
          isProcessing ? "pointer-events-none opacity-80" : "",
        )}
      >
        <input
          type="file"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Importer un fichier CSV"
          accept=".csv"
          onChange={handleFileInput}
          disabled={isProcessing}
        />

        <div className="mb-2 flex size-16 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-transform group-hover:scale-110">
          {isProcessing ? (
            <Loader2 className="size-8 animate-spin text-emerald-600" />
          ) : (
            <UploadCloud
              className={cn(
                "size-8 transition-colors",
                isDragging ? "text-emerald-600" : "text-muted-foreground/70 group-hover:text-emerald-500",
              )}
            />
          )}
        </div>

        <div className="max-w-sm space-y-2">
          {isProcessing ? (
            <>
              <h3 className="font-semibold text-foreground text-lg">Analyse du fichier...</h3>
              <Progress value={progress} className="h-2 w-full" />
              <p className="text-muted-foreground text-sm">Validation des colonnes et de la structure.</p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-foreground text-lg">
                {isDragging ? "Deposez le fichier ici" : "Glissez-deposez votre fichier CSV"}
              </h3>
              <p className="text-muted-foreground text-sm">
                Ou cliquez pour parcourir. Supporte les fichiers standards <strong>.csv</strong> (UTF-8).
              </p>
            </>
          )}
        </div>

        {!isProcessing && (
          <div className="mt-4 flex items-center gap-2 text-muted-foreground/70 text-xs">
            <FileSpreadsheet className="size-4" />
            <span>Modele recommande : SKU, Nom, Quantite</span>
          </div>
        )}
      </div>

      <MappingDialog
        open={showMapping}
        onOpenChange={setShowMapping}
        headers={headers}
        fileName={file?.name || "import.csv"}
        onConfirm={(mapping) => {
          setShowMapping(false);
          setIsProcessing(true);
          setProgress(70);
          window.setTimeout(() => {
            setProgress(100);
            void finalizeImport(mapping);
          }, 400);
        }}
      />
    </>
  );
}
