import "server-only";

import { headers } from "next/headers";

export async function assertSameOrigin() {
  if (process.env.NODE_ENV !== "production") return;

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  if (!origin || !host) {
    throw new Error("Invalid origin");
  }

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("Invalid origin");
  }

  if (originHost !== host) {
    throw new Error("Invalid origin");
  }
}
