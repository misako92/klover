"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Leaf, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { completeOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Votre nom est requis.").max(100),
  companyName: z.string().min(2, "Le nom de votre entreprise est requis.").max(200),
  companyType: z.enum(["ecommerce", "marketplace", "both", "retail"]),
  productCount: z.enum(["1-100", "100-1000", "1000-10000", "10000+"]),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      companyType: undefined,
      productCount: undefined,
    },
    mode: "onChange",
  });

  const canGoToStep2 = form.watch("fullName")?.length >= 2;

  const onSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    setIsLoading(true);
    try {
      await completeOnboarding(values);
      toast.success("Votre espace est prêt !");
      router.push("/dashboard/default");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Klover</span>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm ${step >= 1 ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-400"}`}
            >
              1
            </div>
            <span className={`font-medium text-sm ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
              Vous
            </span>
          </div>
          <div className={`h-px w-8 ${step >= 2 ? "bg-emerald-600" : "bg-zinc-200"}`} />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm ${step >= 2 ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-400"}`}
            >
              2
            </div>
            <span className={`font-medium text-sm ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
              Votre activité
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: About you */}
            {step === 1 && (
              <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-8 shadow-xl shadow-zinc-200/20 ring-1 ring-zinc-900/5 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Comment vous appelez-vous ?</h2>
                    <p className="text-muted-foreground text-sm">Pour personnaliser votre expérience.</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Prénom Nom"
                          autoComplete="name"
                          autoFocus
                          {...field}
                          className="h-11 border-zinc-200 bg-white/50 font-medium transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  disabled={!canGoToStep2}
                  onClick={() => setStep(2)}
                  className="mt-6 h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700"
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: About your company */}
            {step === 2 && (
              <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-8 shadow-xl shadow-zinc-200/20 ring-1 ring-zinc-900/5 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Parlez-nous de votre activité</h2>
                    <p className="text-muted-foreground text-sm">Pour préparer votre tableau de bord.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ma Boutique SAS"
                            autoComplete="organization"
                            autoFocus
                            {...field}
                            className="h-11 border-zinc-200 bg-white/50 font-medium transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'activité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-zinc-200 bg-white/50 font-medium">
                              <SelectValue placeholder="Sélectionnez..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ecommerce">E-commerce (site propre)</SelectItem>
                            <SelectItem value="marketplace">Marketplace (Amazon, Cdiscount...)</SelectItem>
                            <SelectItem value="both">Les deux</SelectItem>
                            <SelectItem value="retail">Retail physique</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de références</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-zinc-200 bg-white/50 font-medium">
                              <SelectValue placeholder="Sélectionnez..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-100">Moins de 100</SelectItem>
                            <SelectItem value="100-1000">100 à 1 000</SelectItem>
                            <SelectItem value="1000-10000">1 000 à 10 000</SelectItem>
                            <SelectItem value="10000+">Plus de 10 000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 flex-1 rounded-xl">
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 flex-[2] rounded-xl bg-emerald-600 font-semibold text-white shadow-md transition-all hover:bg-emerald-700"
                  >
                    {isLoading ? "Préparation de votre espace..." : "Accéder à mon dashboard"}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
