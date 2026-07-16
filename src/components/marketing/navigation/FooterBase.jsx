"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, Leaf, Linkedin } from "lucide-react";

import { subscribeNewsletter } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";

// Default footer links
const defaultColumns = [
  {
    title: "Entreprise",
    links: [
      { label: "Accueil", href: "/" },
      { label: "À propos", href: "/about" },
      { label: "Tarifs", href: "#pricing" },
    ],
  },
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#comment-ca-marche" },
      { label: "Intégrations", href: "#integrations" },
      { label: "Dashboard", href: "/auth/v2/login" },
    ],
  },
];

const defaultSocialLinks = [{ icon: Linkedin, href: "https://linkedin.com/company/klover", label: "LinkedIn" }];

/**
 * Modern Footer with integrated CTA block and newsletter
 * @param {{
 *  logo?: import("react").ReactNode,
 *  productName?: string,
 *  description?: string,
 *  columns?: { title: string; links: { label: string; href: string }[] }[],
 *  socialLinks?: { label: string; href: string; icon?: string }[],
 *  legalLinks?: { label: string; href: string }[],
 *  copyright?: string,
 *  ctaTitle?: string,
 *  ctaSubtitle?: string,
 *  ctaButtonLabel?: string,
 *  ctaButtonHref?: string
 * }} props
 */
const FooterBase = ({
  logo = null,
  productName = "Klover",
  description = "Solution de conformité REP pour e-commerçants. Automatisez vos déclarations et dormez tranquille.",
  columns = defaultColumns,
  socialLinks: _socialLinks,
  legalLinks = [],
  copyright = "",
  ctaTitle = "Automatisez votre conformité REP dès aujourd'hui",
  ctaSubtitle = "Importez vos produits, classifiez automatiquement et générez vos déclarations. Sans prise de tête.",
  ctaButtonLabel = "Commencer gratuitement",
  ctaButtonHref = "/auth/v2/register",
}) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await subscribeNewsletter({ email });
      setSubscribed(true);
      setEmail("");
    } catch {
      // Silently handle — form stays visible for retry
    } finally {
      setSubmitting(false);
    }
  };

  const resolvedLegalLinks = legalLinks.length
    ? legalLinks
    : [
        { label: "Mentions légales", href: "/legal" },
        { label: "Confidentialité", href: "/privacy" },
        { label: "CGU", href: "/terms" },
      ];

  const resolvedCopyright = copyright || `© ${new Date().getFullYear()} ${productName}. Tous droits réservés.`;

  return (
    <footer className="bg-slate-50">
      {/* CTA Block - Emerald gradient like reference */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-14 md:px-16 md:py-16">
          {/* Decorative wave/blob shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="-top-20 -right-20 absolute h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="-bottom-20 -left-20 absolute h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/4 h-40 w-40 rounded-full bg-teal-400/15 blur-2xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <h2 className="mx-auto mb-4 max-w-2xl font-bold text-2xl text-white leading-tight md:text-3xl lg:text-4xl">
              {ctaTitle}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base text-emerald-100 md:text-lg">{ctaSubtitle}</p>
            <Button
              asChild
              size="lg"
              className="gap-2 bg-[#0a945b] px-8 font-semibold text-white shadow-[0_8px_16px_rgba(10,148,91,0.25)] transition-all hover:scale-105 hover:bg-[#088250]"
            >
              <Link href={ctaButtonHref}>
                {ctaButtonLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
          {/* Brand column */}
          <div className="space-y-5">
            {/* Logo */}
            <Link href="/" className="group inline-flex items-center gap-2">
              {logo ? (
                logo
              ) : (
                <>
                  <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
                    <Leaf className="size-4" />
                  </div>
                  <span className="font-bold text-lg text-slate-900 tracking-tight">{productName}</span>
                </>
              )}
            </Link>

            {/* Description */}
            <p className="pr-4 text-slate-600 text-sm leading-relaxed">{description}</p>

            {/* Social links */}
            <div className="flex gap-3 pt-2">
              {defaultSocialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-slate-500 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label={social.label}
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((group) => (
            <div key={group.title} className="space-y-4">
              <p className="font-semibold text-slate-900 text-sm">{group.title}</p>
              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-slate-600 text-sm transition-colors hover:text-emerald-600">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter column */}
          <div className="space-y-4">
            <p className="font-semibold text-slate-900 text-sm">Newsletter</p>
            <p className="text-slate-600 text-sm">Recevez nos conseils conformité et mises à jour produit.</p>

            {subscribed ? (
              <div className="flex items-center gap-2 font-medium text-emerald-600 text-sm">
                <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100">✓</div>
                Merci pour votre inscription !
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-1.5 rounded-lg bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                >
                  S&apos;inscrire
                  <ArrowRight className="size-3.5" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar with separator */}
        <div className="mt-12 border-slate-200/60 border-t pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500 text-xs">{resolvedCopyright}</span>
            <div className="flex flex-wrap gap-4">
              {resolvedLegalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-slate-500 text-xs transition-colors hover:text-emerald-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterBase;
