"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse email valide." }),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
    .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule." })
    .regex(/\d/, { message: "Le mot de passe doit contenir au moins un chiffre." }),
  remember: z.boolean().optional(),
});

function getSafeRedirectTarget(raw?: string | null) {
  if (raw === "/dashboard/default" || raw === "/dashboard/orders") {
    return raw;
  }

  if (/^\/invite\/[a-zA-Z0-9_-]+$/.test(raw ?? "")) {
    return raw as string;
  }

  return "/dashboard/default";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && !form.getValues("email")) {
      form.setValue("email", emailParam);
    }
  }, [form, searchParams]);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    const redirectTarget = getSafeRedirectTarget(searchParams.get("next"));
    setIsLoading(true);
    try {
      await login({ email: values.email, password: values.password });
      toast.success("Connexion réussie.");
      router.push(redirectTarget);
    } catch {
      toast.error("Connexion impossible.");
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Email professionnel
                {field.value && !form.getFieldState("email").invalid ? (
                  <Check className="fade-in zoom-in h-4 w-4 animate-in text-emerald-500" />
                ) : null}
              </FormLabel>
              <FormControl>
                <Input
                  id="email"
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
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                  className="h-11 border-zinc-200 bg-white/50 font-medium backdrop-blur-sm transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </FormControl>
              <div className="flex justify-end">
                <a
                  href="/auth/v2/forgot-password"
                  className="font-medium text-emerald-600 text-xs hover:text-emerald-500 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4 rounded-[4px] border-zinc-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                />
              </FormControl>
              <FormLabel
                htmlFor="login-remember"
                className="cursor-pointer select-none font-medium text-muted-foreground text-sm"
              >
                Rester connecté
              </FormLabel>
            </FormItem>
          )}
        />
        <Button
          className="hover:-translate-y-0.5 h-11 w-full bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </Form>
  );
}
