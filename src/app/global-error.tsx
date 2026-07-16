"use client";

import { useEffect } from "react";

import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-zinc-900">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h1 className="font-bold text-2xl tracking-tight">Une erreur critique est survenue</h1>
              <p className="text-muted-foreground">
                L'application a rencontré un problème inattendu. Nos équipes ont été notifiées.
              </p>
            </div>

            <div className="mb-4 max-h-32 overflow-auto rounded-lg border border-zinc-200 bg-white p-4 text-left font-mono text-xs text-zinc-500">
              {error.message || "Erreur inconnue"}
              {error.digest && <div className="mt-1 text-zinc-400">Digest: {error.digest}</div>}
            </div>

            <Button
              onClick={() => (typeof reset === "function" ? reset() : window.location.reload())}
              className="h-12 w-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <RefreshCcw className="mr-2 size-4" /> Recharger l'application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
