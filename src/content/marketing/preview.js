export const dashboardPreviewSectionConfig = {
  id: "apercu-dashboard",
  eyebrow: "Votre cockpit conformité",
  title: "Un tableau de bord pensé pour l'action",
  subtitle: "Pas de graphiques inutiles. Chaque métrique déclenche une action concrète.",
  align: "center",
  image: "/images/dashboard.png",
  features: [
    {
      id: "status",
      title: "Statut conformité",
      description: "Vert = conforme. Rouge = action requise. Pas d'ambiguïté.",
      position: "top-left",
    },
    {
      id: "tonnage",
      title: "Tonnage & contributions",
      description: "Volumes cumulés et montants estimés, recalculés à chaque import.",
      position: "top-right",
    },
    {
      id: "alerts",
      title: "Centre d'alerte",
      description: "Produits non classés, poids manquants, échéances proches — chaque alerte est actionnable.",
      position: "bottom-left",
    },
    {
      id: "actions",
      title: "Prochaines actions",
      description: "Klover vous dit exactement quoi faire et dans quel ordre de priorité.",
      position: "bottom-right",
    },
  ],
  cta: {
    label: "Voir mon statut conformité",
    href: "/auth/v2/register",
  },
};
