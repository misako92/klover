"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Send } from "lucide-react";
import { toast } from "sonner";

import { submitDeclaration } from "@/app/actions/declarations";
import { Button } from "@/components/ui/button";

export function SubmitDeclarationButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-emerald-600"
      title="Soumettre"
      aria-label="Soumettre la déclaration"
      aria-busy={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await submitDeclaration(id);
            toast.success("Déclaration soumise");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur lors de la soumission");
          }
        });
      }}
      disabled={isPending}
    >
      <Send className="size-4" />
    </Button>
  );
}
