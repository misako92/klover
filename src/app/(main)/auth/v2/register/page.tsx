import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";

import { RegisterForm } from "../../_components/register-form";

export default function RegisterV2() {
  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoignez Klover pour simplifier votre conformité REP."
      linkText="Déjà un compte ? Se connecter"
      linkHref="/auth/v2/login"
    >
      <Suspense
        fallback={<div className="animate-pulse text-muted-foreground text-sm">Chargement du formulaire...</div>}
      >
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
