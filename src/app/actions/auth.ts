"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { z } from "zod";

import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { rateLimiter } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { emailService } from "@/services/email";

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Le mot de passe est requis"),
});

const registerSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string().min(8),
    next: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

function _getSafeRedirectTarget(raw?: string | null) {
  const nextValue = raw?.trim();
  if (!nextValue) {
    return "/dashboard/default";
  }

  if (nextValue === "/dashboard/default" || nextValue === "/dashboard/orders") {
    return nextValue;
  }

  if (/^\/invite\/[a-zA-Z0-9_-]+$/.test(nextValue)) {
    return nextValue;
  }

  return "/dashboard/default";
}

async function getRateLimitKey(email: string) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();

  return `${realIp || forwardedFor || "unknown"}:${email.toLowerCase()}`;
}

export async function login(values: z.infer<typeof loginSchema>) {
  await assertSameOrigin();
  const parsed = loginSchema.parse(values);

  const limiter = rateLimiter("login", 5, 60_000);
  if (!limiter.check(await getRateLimitKey(parsed.email))) {
    throw new Error("Trop de tentatives. Réessayez dans une minute.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });
  if (error) {
    throw new Error("Identifiants incorrects");
  }
}

export async function register(values: z.infer<typeof registerSchema>) {
  await assertSameOrigin();
  const parsed = registerSchema.parse(values);

  const limiter = rateLimiter("register", 3, 60_000);
  if (!limiter.check(await getRateLimitKey(parsed.email))) {
    throw new Error("Trop de tentatives. Réessayez dans une minute.");
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
  });

  if (authError) {
    throw new Error(authError.message || "Erreur lors de l'inscription");
  }

  if (!authData.user) {
    throw new Error("Erreur : aucun utilisateur retourné par Supabase");
  }

  const userId = authData.user.id;
  const email = parsed.email;

  // Check if user already exists in DB
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (existingUser) {
    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      });
      if (signInError) {
        throw new Error("Ce compte existe déjà. Veuillez vous connecter.");
      }
    }

    // If user has an org, go to dashboard; otherwise go to onboarding
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: existingUser.id },
      select: { orgId: true },
    });
    if (membership) {
      (await cookies()).set("org_id", membership.orgId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
      redirect("/dashboard/default");
    }
    redirect("/onboarding");
    return;
  }

  // Create user record without name (will be set during onboarding)
  try {
    await prisma.user.create({
      data: {
        id: userId,
        email,
      },
    });

    await emailService.sendEmail({
      to: email,
      subject: "Bienvenue sur Klover !",
      html: `
        <h1>Bienvenue à bord !</h1>
        <p>Votre compte a été créé avec succès.</p>
        <p>Finalisez votre profil pour commencer à sécuriser votre conformité REP.</p>
        <br/>
        <p>L'équipe Klover</p>
      `,
    });
  } catch (dbError) {
    // biome-ignore lint/suspicious/noExplicitAny: error checking
    if ((dbError as any).code === "P2002") {
      redirect("/onboarding");
      return;
    }
    throw new Error("Erreur lors de la création du compte");
  }

  // Redirect to onboarding to collect name + company
  redirect("/onboarding");
}

export async function requestPasswordReset(email: string) {
  await assertSameOrigin();
  const parsed = z.string().email().parse(email);

  const limiter = rateLimiter("password-reset", 3, 60_000);
  if (!limiter.check(await getRateLimitKey(parsed))) {
    throw new Error("Trop de tentatives. Réessayez dans une minute.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed, {
    redirectTo: `${(await headers()).get("origin")}/auth/v2/update-password`,
  });

  if (error) {
    throw new Error("Erreur lors de l'envoi du lien de réinitialisation.");
  }
}

export async function updatePassword(newPassword: string) {
  await assertSameOrigin();
  const parsed = passwordSchema.parse(newPassword);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed });

  if (error) {
    throw new Error("Erreur lors de la mise à jour du mot de passe.");
  }
}

export async function logout() {
  await assertSameOrigin();

  const supabase = await createClient();
  await supabase.auth.signOut();

  (await cookies()).delete("org_id");
  redirect("/auth/v2/login");
}
