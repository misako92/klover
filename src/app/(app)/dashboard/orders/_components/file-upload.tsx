"use client";

import * as React from "react";

import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false); // Used for visual feedback only
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;

    // Client-side validation
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 50MB)");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast.error("Format non supporté. Utilisez CSV ou XLSX.");
      return;
    }

    setIsUploading(true);
    // Simulate a brief check/loading
    setTimeout(() => {
      setIsUploading(false);
      onFileSelect(file);
    }, 600);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Drag and drop custom interactions require semantic div over generic button
    <div
      className={cn(
        "group flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300 ease-in-out",
        isDragging ? "border-emerald-500 bg-emerald-50/20" : "border-border hover:border-emerald-400 hover:bg-muted/40",
        isUploading && "pointer-events-none opacity-50",
      )}
      role="button"
      tabIndex={0}
      aria-label="Importer un fichier de ventes"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!isUploading) fileInputRef.current?.click();
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        aria-label="Sélectionner un fichier CSV ou XLSX"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="font-semibold text-emerald-900 text-lg">Analyse du fichier en cours...</p>
        </div>
      ) : (
        <div className="pointer-events-none flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted/40 p-6 shadow-sm transition-colors duration-300 group-hover:scale-110 group-hover:bg-emerald-50">
            <UploadCloud className="h-10 w-10 text-muted-foreground/70 transition-colors group-hover:text-emerald-600" />
          </div>
          <h3 className="mt-4 font-bold text-foreground/80 text-xl transition-colors group-hover:text-emerald-900">
            Glissez votre fichier ici
          </h3>
          <p className="font-medium text-muted-foreground/70 text-sm">ou cliquez pour parcourir (CSV, XLSX)</p>
          <p className="mt-6 rounded-full bg-muted/40 px-3 py-1 text-muted-foreground/60 text-xs">Taille max: 50MB</p>
        </div>
      )}
    </div>
  );
}
