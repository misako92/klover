"use client";

import * as React from "react";

import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

interface BulkEditToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  onSuccess: (ids: string[]) => void;
}

export function BulkEditToolbar({ selectedCount, selectedIds, onSuccess }: BulkEditToolbarProps) {
  const [isPending, startTransition] = React.useTransition();
  const { bulkMarkClassified, generateAISuggestions } = useComplianceData();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await bulkMarkClassified(selectedIds);
        toast.success(`${selectedCount} produits classes avec succes !`);
        onSuccess(selectedIds);
      } catch {
        toast.error("Erreur lors de la mise a jour");
      }
    });
  };

  const handleGenerateAI = () => {
    startTransition(async () => {
      try {
        await generateAISuggestions(selectedIds);
        toast.success(`${selectedCount} suggestions generees !`);
        onSuccess(selectedIds);
      } catch {
        toast.error("Erreur lors de la generation IA");
      }
    });
  };

  return (
    <div className="-translate-x-1/2 slide-in-from-bottom-5 fixed bottom-6 left-1/2 z-50 flex animate-in items-center gap-4 rounded-full bg-foreground px-6 py-3 text-background shadow-xl">
      <span className="font-semibold">{selectedCount} produits selectionnes</span>
      <div className="h-4 w-px bg-background/20" />
      <Button
        size="sm"
        variant="secondary"
        className="gap-2 border-0 bg-blue-500 text-white hover:bg-blue-600"
        onClick={handleGenerateAI}
        disabled={isPending}
      >
        <Sparkles className="size-4" />
        Suggerer avec l'IA
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="gap-2 border-0 bg-emerald-500 text-white hover:bg-emerald-600"
        onClick={handleConfirm}
        disabled={isPending}
      >
        <Check className="size-4" />
        Confirmer tout
      </Button>
      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => onSuccess([])}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
