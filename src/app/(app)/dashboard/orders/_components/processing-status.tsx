"use client";

import { Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";

interface ProcessingStatusProps {
  progress: number;
}

export function ProcessingStatus({ progress }: ProcessingStatusProps) {
  return (
    <div className="fade-in zoom-in flex animate-in flex-col items-center justify-center space-y-6 p-12 text-center duration-300">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
        <Loader2 className="relative z-10 h-16 w-16 animate-spin text-emerald-600" />
      </div>
      <div className="w-full max-w-md space-y-2">
        <h3 className="font-semibold text-xl">Traitement en cours...</h3>
        <p className="text-muted-foreground text-sm">Nous analysons votre fichier et mettons à jour le catalogue.</p>
      </div>
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-right text-muted-foreground text-xs">{progress}%</p>
      </div>
    </div>
  );
}
