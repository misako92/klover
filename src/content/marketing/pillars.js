import { Briefcase, Store, Users } from "lucide-react";

export const pillarsSectionConfig = {
  id: "pour-qui",
  eyebrow: "Pour qui",
  title: "Klover est fait pour",
  subtitle: "Des équipes qui veulent une conformité continue, pas une course annuelle.",
  align: "center",
  pillars: [
    {
      id: "ecommerce",
      title: "E-commerçants 50+ références",
      description: "Shopify, WooCommerce ou CSV, avec un catalogue qui évolue vite.",
      icon: Store,
    },
    {
      id: "ops-finance",
      title: "Ops / finance / conformité",
      description: "Besoin de pilotage des éco-contributions et de preuves opposables.",
      icon: Briefcase,
    },
    {
      id: "agencies",
      title: "Agences et consultants",
      description: "Plusieurs comptes clients à sécuriser sans explosion d'erreurs.",
      icon: Users,
    },
  ],
};
