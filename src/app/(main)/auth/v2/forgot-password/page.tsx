"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { requestPasswordReset } from "@/app/actions/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse email valide." }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      await requestPasswordReset(values.email);
      setEmailSent(true);
      toast.success("Lien de reinitialisation envoye.");
    } catch {
      toast.error("Impossible d'envoyer le lien. Verifiez votre adresse email.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Email envoye"
        subtitle="Consultez votre boite de reception pour reinitialiser votre mot de passe."
        linkText="Retour a la connexion"
        linkHref="/auth/v2/login"
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <Mail className="size-6 text-emerald-600" />
          </div>
          <p className="text-muted-foreground text-sm">
            Si un compte existe avec cette adresse, vous recevrez un lien de reinitialisation dans quelques minutes.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublie"
      subtitle="Entrez votre adresse email pour recevoir un lien de reinitialisation."
      linkText="Retour a la connexion"
      linkHref="/auth/v2/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email professionnel</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nom@entreprise.com"
                    autoComplete="email"
                    {...field}
                    className="h-11 border-zinc-200 bg-white/50 font-medium backdrop-blur-sm transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className="hover:-translate-y-0.5 h-11 w-full bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
          </Button>
          <div className="text-center">
            <Link
              href="/auth/v2/login"
              className="inline-flex items-center gap-1 font-medium text-emerald-600 text-sm hover:text-emerald-500"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
