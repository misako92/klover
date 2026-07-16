import type { ReactNode } from "react";

import type { Metadata } from "next";

import FooterBase from "@/components/marketing/navigation/FooterBase";
import { NavbarBase } from "@/components/marketing/navigation/NavbarBase";
import { footerSectionConfig } from "@/content/marketing/footer";
import { cta, navItems, showThemeToggle } from "@/content/marketing/navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://klover.co"),
  title: {
    default: "Klover — Conformité REP Emballages pour e-commerçants",
    template: "%s | Klover",
  },
  description:
    "Automatisez vos déclarations CITEO/LEKO, classifiez vos emballages et évitez jusqu'à 150 000 € d'amende REP. La plateforme conformité REP #1 pour e-commerçants en France.",
  keywords: [
    "conformité REP",
    "emballages",
    "CITEO",
    "LEKO",
    "déclaration REP 2026",
    "outil REP e-commerce",
    "responsabilité élargie producteur",
  ],
  openGraph: {
    title: "Klover — Le pare-feu conformité REP 2026",
    description:
      "Classifiez vos emballages, calculez vos contributions et soumettez vos déclarations en quelques clics. Évitez jusqu'à 150 000 € d'amende.",
    url: "https://klover.co",
    siteName: "Klover",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klover — Conformité REP Emballages",
    description: "La plateforme qui automatise votre conformité REP emballages. Déclarations CITEO/LEKO en 3 clics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Premium animated background - MAXIMUM VISIBILITY */}
      <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Strong base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-50 to-teal-100" />

        {/* Large animated gradient orbs - VERY VISIBLE */}
        <div className="-top-32 -left-32 absolute h-[700px] w-[700px] animate-blob-slow rounded-full bg-emerald-300/80 blur-[100px]" />
        <div className="-right-32 absolute top-1/3 h-[600px] w-[600px] animate-blob-medium rounded-full bg-teal-300/70 blur-[100px]" />
        <div className="-bottom-32 absolute left-1/4 h-[500px] w-[800px] animate-blob-fast rounded-full bg-green-200/70 blur-[120px]" />

        {/* Center glow */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[600px] w-[1000px] rounded-full bg-white/60 blur-[150px]" />

        {/* Top stripe accent */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />

        {/* Noise texture for depth */}
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <NavbarBase navItems={navItems} cta={cta} showThemeToggle={showThemeToggle} />
      <div className="relative z-10">
        {children}
        <FooterBase {...footerSectionConfig} />
      </div>
    </>
  );
}
