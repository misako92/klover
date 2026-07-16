import { FileCheck, Tags, UploadCloud } from "lucide-react";

export const howItWorksSectionConfig = {
  id: "comment-ca-marche",
  eyebrow: "Simple et efficace",
  title: "3 étapes vers la conformité",
  subtitle: "De l'import à l'export conforme, tout est guidé. Premier résultat en moins de 5 minutes.",
  align: "center",
  steps: [
    {
      step: "01",
      icon: UploadCloud,
      title: "Importez vos ventes",
      description: "Glissez votre CSV, Klover mappe les colonnes automatiquement. Zéro saisie manuelle.",
      highlight: false,
    },
    {
      step: "02",
      icon: Tags,
      title: "Classification automatique",
      description:
        "Chaque produit est classifié par matière avec un score de confiance. Les cas ambigus sont signalés pour validation.",
      highlight: true,
    },
    {
      step: "03",
      icon: FileCheck,
      title: "Déclarez en 1 clic",
      description:
        "Tonnages calculés, contributions estimées, fichier conforme CITEO/Léko prêt à l'export avec audit trail.",
      highlight: false,
    },
  ],
  cta: {
    label: "Faire mon premier import",
    href: "/auth/v2/register",
  },
};
