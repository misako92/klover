import type { ReactNode } from "react";

import { SubscriptionProvider } from "@/components/subscription/subscription-provider";
import { requireUser } from "@/lib/auth/context";
import { getSubscriptionState } from "@/lib/subscription/current-plan";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const state = await getSubscriptionState();

  return <SubscriptionProvider state={state}>{children}</SubscriptionProvider>;
}
