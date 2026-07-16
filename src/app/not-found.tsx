"use client";

import Link from "next/link";

import { ArrowLeft, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Aurora Background (Simplified version of AuthLayout) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] h-[80%] w-[80%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute right-[-20%] bottom-[-20%] h-[80%] w-[80%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay brightness-100 contrast-150" />
      </div>

      <div className="relative z-10 flex max-w-lg flex-col items-center space-y-8 px-4 text-center">
        <div className="space-y-4">
          <h1 className="select-none bg-gradient-to-br from-emerald-500 to-emerald-900 bg-clip-text font-bold text-9xl text-transparent tracking-tighter">
            404
          </h1>
          <h2 className="font-bold text-3xl tracking-tight">Page introuvable</h2>
          <p className="text-lg text-muted-foreground">
            La page que vous recherchez semble avoir été déplacée ou n'existe plus.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
          <Link href="/dashboard/default">
            <Button className="hover:-translate-y-0.5 h-12 w-full bg-emerald-600 px-8 text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl sm:w-auto">
              <Home className="mr-2 size-4" /> Tableau de bord
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-12 border-zinc-200 hover:bg-zinc-50"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 size-4" /> Retour
          </Button>
        </div>

        <div className="w-full border-border/40 border-t pt-8">
          <p className="text-muted-foreground text-xs">
            Si vous pensez qu'il s'agit d'une erreur, contactez le{" "}
            <Link href="/contact" className="underline hover:text-emerald-600">
              support technique
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
