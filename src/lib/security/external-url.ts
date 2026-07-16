import "server-only";

import { isIP } from "node:net";

interface NormalizeExternalUrlOptions {
  restrictToShopifyDomain?: boolean;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")
  );
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized === "localhost" || normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }
  if (ipVersion === 6) {
    return isPrivateIpv6(normalized);
  }

  return false;
}

export function normalizeExternalServiceUrl(rawUrl: string, options: NormalizeExternalUrlOptions = {}) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("URL du shop requise");
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const normalized = new URL(candidate);

  if (normalized.protocol !== "https:") {
    throw new Error("Seules les URLs HTTPS sont autorisées");
  }

  if (normalized.username || normalized.password) {
    throw new Error("Les URLs avec identifiants intégrés sont interdites");
  }

  if (isPrivateHostname(normalized.hostname)) {
    throw new Error("URL privée ou locale interdite");
  }

  if (options.restrictToShopifyDomain && !normalized.hostname.endsWith(".myshopify.com")) {
    throw new Error("Utilisez le domaine .myshopify.com de votre boutique Shopify");
  }

  normalized.hash = "";

  return normalized.toString().replace(/\/$/, "");
}
