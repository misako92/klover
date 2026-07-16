import "server-only";

import Stripe from "stripe";

let client: Stripe | undefined;

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
}

// Lazy proxy: the Stripe client is only instantiated on first use, so importing
// this module never throws (Next.js imports routes at build time without env vars).
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    client ??= createStripe();
    return Reflect.get(client, prop);
  },
});
