"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BillingError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <h2 className="font-semibold text-lg">Une erreur est survenue</h2>
      <p className="max-w-sm text-muted-foreground text-sm">
        {error.message || "Impossible de charger les donnees. Réessayez ou contactez le support."}
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Réessayer
      </Button>
    </div>
  );
}
