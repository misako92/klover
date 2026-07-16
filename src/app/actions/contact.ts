"use server";

import { headers } from "next/headers";

import { z } from "zod";

import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { rateLimiter } from "@/lib/security/rate-limit";
import { emailService } from "@/services/email";

const contactSchema = z.object({
  company: z.string().min(1, "Le nom de l'entreprise est requis").max(200),
  email: z.string().email("Email invalide"),
  companyType: z.enum(["ecommerce", "marketplace", "both", "retail"]),
  productCount: z.enum(["1-100", "100-1000", "1000-10000", "10000+"]),
  urgency: z.enum(["urgent", "soon", "planning"]).optional(),
  message: z.string().max(2000).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function getClientIp() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return realIp || forwardedFor || "unknown";
}

export async function submitContactForm(data: ContactFormData) {
  await assertSameOrigin();

  const parsed = contactSchema.parse(data);

  const limiter = rateLimiter("contact", 3, 60_000);
  if (!limiter.check(await getClientIp())) {
    throw new Error("Trop de tentatives. Réessayez dans une minute.");
  }

  const urgencyLabels: Record<string, string> = {
    urgent: "🔴 Urgent — Contrôle imminent",
    soon: "🟡 Bientôt — Dans les 3 mois",
    planning: "🟢 Planification — Pas de deadline",
  };

  const companyTypeLabels: Record<string, string> = {
    ecommerce: "E-commerce (site propre)",
    marketplace: "Marketplace (Amazon, Cdiscount...)",
    both: "Les deux",
    retail: "Retail physique",
  };

  // Persist in DB
  await prisma.contactRequest.create({
    data: {
      company: parsed.company,
      email: parsed.email,
      companyType: parsed.companyType,
      productCount: parsed.productCount,
      urgency: parsed.urgency ?? null,
      message: parsed.message ?? null,
    },
  });

  // Send notification email to team
  await emailService.sendEmail({
    to: "contact@klover.co",
    subject: `[Klover] Nouveau contact — ${escapeHtml(parsed.company)}`,
    html: `
      <h2>Nouvelle demande de diagnostic</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; font-weight: bold;">Entreprise</td><td style="padding: 8px;">${escapeHtml(parsed.company)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${escapeHtml(parsed.email)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Type d'activité</td><td style="padding: 8px;">${companyTypeLabels[parsed.companyType] ?? escapeHtml(parsed.companyType)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Nombre de produits</td><td style="padding: 8px;">${escapeHtml(parsed.productCount)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Urgence</td><td style="padding: 8px;">${parsed.urgency ? urgencyLabels[parsed.urgency] : "Non spécifié"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Message</td><td style="padding: 8px;">${parsed.message ? escapeHtml(parsed.message) : "—"}</td></tr>
      </table>
    `,
  });

  // Send confirmation email to prospect
  await emailService.sendEmail({
    to: parsed.email,
    subject: "Klover — Votre demande a bien été reçue",
    html: `
      <h1>Merci ${escapeHtml(parsed.company)} ! 🌿</h1>
      <p>Nous avons bien reçu votre demande de diagnostic conformité REP.</p>
      <p>Un expert de notre équipe vous contactera sous <strong>24 heures</strong> avec une analyse personnalisée.</p>
      <br/>
      <p>À très vite,</p>
      <p>L'équipe Klover</p>
    `,
  });

  return { success: true };
}
