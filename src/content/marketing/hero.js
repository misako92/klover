export const heroSectionConfig = {
  id: "hero",
  eyebrow: undefined,
  title: "Évitez les amendes REP. Maîtrisez vos éco-contributions.",
  subtitle:
    "Importez vos ventes, classifiez vos produits et générez des déclarations conformes — en quelques clics au lieu de plusieurs jours.",
  primaryCta: {
    label: "Protéger mon activité",
    href: "/auth/v2/register",
  },
  secondaryCta: {
    label: "Voir comment ça marche",
    href: "/demo",
  },
  mockupImage: {
    src: "/images/dashboard.png",
    alt: "Dashboard Klover - aperçu du tableau de bord de conformité REP",
    priority: true,
  },
  stats: [
    { value: "150k€", label: "D'amende évitable" },
    { value: "2 jours", label: "Économisés par mois" },
    { value: "5 min", label: "Pour votre 1er import" },
  ],
};
