import Image from "next/image";

export const footerSectionConfig = {
  logo: (
    <div className="flex items-center gap-2">
      <Image src="/logo/logo.svg" alt="Klover logo" width={24} height={24} className="h-6 w-6" />
      <span className="font-bold text-lg tracking-tight">Klover</span>
    </div>
  ),
  productName: "Klover",
  description:
    "Le Compliance Firewall REP des e-commerçants. Monitoring continu, alertes et audit trail pour rester conforme.",
  contactEmail: "contact@klover.co",
  columns: [
    {
      title: "Produit",
      links: [
        { label: "Le risque", href: "#risks" },
        { label: "Solution", href: "#comment-ca-marche" },
        { label: "Dashboard", href: "#apercu-dashboard" },
        { label: "Tarifs", href: "#pricing" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { label: "FAQ", href: "#faq" },
        { label: "Témoignages", href: "#temoignages" },
        { label: "Créer un compte gratuit", href: "/auth/v2/register" },
        { label: "Demander une démo", href: "/demo" },
      ],
    },
    {
      title: "Entreprise",
      links: [
        { label: "À propos", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
  socialLinks: [
    { label: "LinkedIn", href: "https://linkedin.com/company/klover", icon: "linkedin" },
    { label: "Twitter", href: "https://twitter.com/klover_co", icon: "twitter" },
  ],
  legalLinks: [
    { label: "Mentions légales", href: "/legal" },
    { label: "Confidentialité", href: "/privacy" },
    { label: "CGU", href: "/terms" },
  ],
  copyright: `© ${new Date().getFullYear()} Klover. Tous droits réservés.`,
};
