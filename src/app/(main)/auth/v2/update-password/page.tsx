"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updatePassword } from "@/app/actions/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caracteres." })
      .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule." })
      .regex(/\d/, { message: "Le mot de passe doit contenir au moins un chiffre." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      await updatePassword(values.password);
      toast.success("Mot de passe mis a jour avec succes.");
      router.push("/auth/v2/login");
    } catch {
      toast.error("Erreur lors de la mise a jour du mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
      linkText="Retour a la connexion"
      linkHref="/auth/v2/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
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
            className="hover:-translate-y-0.5 h-11 w-full bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
