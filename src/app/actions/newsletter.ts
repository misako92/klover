"use server";

import { headers } from "next/headers";

import { z } from "zod";

import prisma from "@/lib/db";
import { assertSameOrigin } from "@/lib/security/csrf";
import { rateLimiter } from "@/lib/security/rate-limit";

const newsletterSchema = z.object({
  email: z.string().email("Email invalide"),
});

async function getClientIp() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return realIp || forwardedFor || "unknown";
}

export async function subscribeNewsletter(formData: { email: string }) {
  await assertSameOrigin();
  const parsed = newsletterSchema.parse(formData);

  const limiter = rateLimiter("newsletter", 3, 60_000);
  if (!limiter.check(await getClientIp())) {
    throw new Error("Trop de tentatives. Réessayez dans une minute.");
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.email },
    update: {},
    create: { email: parsed.email },
  });

  return { success: true };
}
