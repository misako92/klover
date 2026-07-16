"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, CheckCircle2, HelpCircle, Package } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ClassificationStatus = "CONFIRMED" | "NEEDS_REVIEW" | "PENDING" | "ARCHIVED";
export type Product = {
  id: string;
  name: string;
  sku: string;
  materialType: string | null;
  weightG: number | null;
  status: ClassificationStatus;
  ecoOrganism?: string | null;
  packagingType?: string | null;
  isReusable?: boolean | null;
  reuseCount?: number | null;
  classificationSource?: string | null;
  reviewReason?: string | null;
  confidence?: number | null;
};

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
        className="translate-y-[2px] border-input data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
        className="translate-y-[2px] border-input data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Produit" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/40">
          <Package className="size-5 text-muted-foreground/60" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.name}</span>
          <span className="font-mono text-muted-foreground/70 text-xs">{row.original.sku}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "packagingType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type d'emb." />,
    cell: ({ row }) => {
      const type = row.original.packagingType || "PRIMARY";
      const isPro = type === "SECONDARY" || type === "TERTIARY";
      return (
        <Badge
          variant="outline"
          className={`font-mono text-xs ${isPro ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}
        >
          {type === "PRIMARY" ? "Ménager" : type === "SECONDARY" ? "Secondaire" : "Tertiaire"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "materialType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code Matière" />,
    cell: ({ row }) => {
      const mat = row.original.materialType;
      const isReusable = row.original.isReusable;
      const reuseCount = row.original.reuseCount;

      return (
        <div className="flex flex-col items-start gap-1">
          {mat ? (
            <Badge variant="outline" className="border-border bg-muted/40 font-mono text-muted-foreground text-xs">
              {mat}
            </Badge>
          ) : (
            <span className="text-muted-foreground/70 text-xs italic">Non défini</span>
          )}
          {isReusable && (
            <Badge
              variant="outline"
              className="h-4 border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700"
            >
              Réemploi ({reuseCount || 1}x)
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "weightG",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Poids Unit." />,
    cell: ({ row }) => {
      const weight = row.original.weightG;
      return <div className="font-medium text-foreground/80 tabular-nums">{weight ? `${weight} g` : "-"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="État" />,
    cell: ({ row }) => {
      const status = row.original.status as ClassificationStatus;

      if (status === "CONFIRMED") {
        return (
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-200 bg-emerald-50 py-1 pr-2.5 pl-1.5 text-emerald-700"
          >
            <CheckCircle2 className="size-3.5" />
            <span className="font-medium">Validé</span>
          </Badge>
        );
      }

      const isAISuggestion = row.original.classificationSource === "AI_SUGGESTION";
      const confidence = row.original.confidence ? Math.round(row.original.confidence * 100) : 0;

      const statusBadge = (
        <Badge
          variant="outline"
          className={`gap-1.5 py-1 pr-2.5 pl-1.5 ${
            status === "NEEDS_REVIEW"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : status === "PENDING"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-border bg-muted/40 text-foreground/80"
          }`}
        >
          {status === "NEEDS_REVIEW" ? <AlertCircle className="size-3.5" /> : <HelpCircle className="size-3.5" />}
          <span className="font-medium">
            {status === "NEEDS_REVIEW" ? "À compléter" : "En attente"}
            {isAISuggestion && ` (${confidence}%)`}
          </span>
        </Badge>
      );

      if (isAISuggestion && row.original.reviewReason) {
        return (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block cursor-help">{statusBadge}</div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] text-xs">
                <p>
                  <strong>Suggestion IA :</strong> {row.original.reviewReason}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      const fallbackStatus = status === "PENDING" ? "PENDING" : "NEEDS_REVIEW";

      if (fallbackStatus === "NEEDS_REVIEW") {
        return statusBadge;
      }

      if (fallbackStatus === "PENDING") {
        return statusBadge;
      }

      if (status === "ARCHIVED") {
        return (
          <Badge
            variant="outline"
            className="gap-1.5 border-border bg-muted/50 py-1 pr-2.5 pl-1.5 text-muted-foreground"
          >
            <Package className="size-3.5" />
            <span className="font-medium">Archivé</span>
          </Badge>
        );
      }

      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
    },
  },
];
