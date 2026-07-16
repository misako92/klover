"use client";

import * as React from "react";
import { CloudUpload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // in bytes
    className?: string;
}

export function FileDropzone({ onFileSelect, accept = ".csv", maxSize = 5 * 1024 * 1024, className }: FileDropzoneProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) validateAndSelect(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSelect(file);
    };

    const validateAndSelect = (file: File) => {
        // Basic validation could go here (type, size)
        onFileSelect(file);
    };

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer",
                isDragging
                    ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]"
                    : "border-border/60 bg-muted/5 hover:bg-muted/10 hover:border-emerald-500/50",
                className
            )}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
            />

            <div className={cn(
                "flex size-16 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-emerald-100/50",
                isDragging && "bg-emerald-100 text-emerald-600"
            )}>
                <CloudUpload className={cn("size-8 text-muted-foreground transition-colors group-hover:text-emerald-600", isDragging && "text-emerald-600")} />
            </div>

            <div className="text-center space-y-1">
                <p className="text-lg font-medium text-foreground">
                    <span className="text-emerald-600">Cliquez pour upload</span> ou glissez le fichier ici
                </p>
                <p className="text-sm text-muted-foreground">
                    Format supporté: CSV (max 5MB)
                </p>
            </div>

            <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-background/50 px-2 py-1 rounded-md border border-border/40">
                    <FileSpreadsheet className="size-3.5" />
                    <span>structure-export.csv</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-background/50 px-2 py-1 rounded-md border border-border/40">
                    <FileSpreadsheet className="size-3.5" />
                    <span>ventes_2024.csv</span>
                </div>
            </div>
        </div>
    );
}
