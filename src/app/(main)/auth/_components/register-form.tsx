"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { register } from "@/app/actions/auth";
import { getStrength, getStrengthLabel, PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z
  .object({
    email: z.string().email({ message: "Veuillez saisir une adresse email valide." }),
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
      .regex(/[A-Z]/, { message: "Le mot de passe doit contenir une majuscule." })
      .regex(/[0-9]/, { message: "Le mot de passe doit contenir un chiffre." }),
    confirmPassword: z.string().min(8, { message: "La confirmation doit contenir au moins 8 caractères." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        next: searchParams.get("next") ?? undefined,
      });
      toast.success("Compte créé avec succès. Redirection...");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  const passwordValue = form.watch("password");
  const strength = getStrength(passwordValue);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                  className="h-11 border-zinc-200 bg-white/50 font-medium backdrop-blur-sm transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </FormControl>
              {field.value ? (
                <div className="space-y-1">
                  <PasswordStrength score={strength} />
                  <p className="text-right font-medium text-muted-foreground text-xs">{getStrengthLabel(strength)}</p>
                </div>
              ) : null}
              <FormDescription className="text-xs">8 caractères min, 1 majuscule et 1 chiffre requis.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                  className="h-11 border-zinc-200 bg-white/50 font-medium backdrop-blur-sm transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="hover:-translate-y-0.5 h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Création du compte..." : "Créer mon compte"}
        </Button>

        <p className="text-center text-muted-foreground text-xs">
          En créant un compte, vous acceptez nos{" "}
          <a href="/terms" className="text-emerald-600 underline hover:text-emerald-500">
            conditions
          </a>{" "}
          et notre{" "}
          <a href="/privacy" className="text-emerald-600 underline hover:text-emerald-500">
            politique de confidentialité
          </a>
          .
        </p>
      </form>
    </Form>
  );
}
