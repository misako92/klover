"use client";

import { useState } from "react";

import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function AccountActions({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success("Email de réinitialisation envoyé. Vérifiez votre boîte de réception.");
    } catch {
      toast.error("Erreur lors de l'envoi de l'email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handlePasswordReset} disabled={loading}>
      <KeyRound className="mr-2 size-4" />
      Changer le mot de passe
    </Button>
  );
}
