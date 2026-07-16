import { AlertTriangle, Euro, FileWarning } from "lucide-react";

export const risksSectionConfig = {
  id: "risks",
  eyebrow: "Le Coût de l'Inaction",
  title: "La non-conformité REP n'est plus une option.",
  subtitle:
    "Les marketplaces bloquent vos ventes. Les douanes saisissent. Les amendes s'accumulent. Sans maîtrise de vos données, le risque est immédiat.",
  align: "center",
  risks: [
    {
      id: "obligation",
      title: "Blocage immédiat des ventes",
      description:
        "Amazon, Cdiscount et Leboncoin suspendent les comptes sans numéro d'identifiant unique (UID) valide ou déclaration à jour.",
      icon: FileWarning,
    },
    {
      id: "fines",
      title: "Sanctions & Redressements",
      description:
        "Jusqu'à 30 000€ d'amende administrative par infraction, avec effet rétroactif sur vos volumes non déclarés.",
      icon: AlertTriangle,
    },
    {
      id: "overpay",
      title: "Pertes financières silencieuses",
      description:
        "Sans système automatisé, vous surpayez vos éco-contributions à cause d'erreurs d'arrondis et de doubles déclarations.",
      icon: Euro,
    },
  ],
  cta: null,
};
