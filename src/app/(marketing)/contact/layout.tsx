import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Parlez à un expert conformité REP",
  description:
    "Demandez un diagnostic personnalisé de votre situation REP. Notre équipe vous répond sous 24h avec un plan d'action concret.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
