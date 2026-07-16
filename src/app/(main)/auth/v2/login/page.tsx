import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";

import { LoginForm } from "../../_components/login-form";

export default function LoginV2() {
  return (
    <AuthLayout
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre tableau de bord."
      linkText="Pas encore de compte ? Créer un compte"
      linkHref="/auth/v2/register"
    >
      <Suspense
        fallback={<div className="animate-pulse text-muted-foreground text-sm">Chargement du formulaire...</div>}
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
