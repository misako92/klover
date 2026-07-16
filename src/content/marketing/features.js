export const featuresSectionConfig = {
  id: "protection",
  eyebrow: "Comment Klover vous protège",
  title: "Le Compliance Firewall AGEC/REP en 3 blocs",
  subtitle: "Surveillance, alertes, preuves. Chaque erreur détectée avant la déclaration, c'est une amende évitée.",
  align: "left",
  layout: "columns",
  features: [
    {
      badge: "Surveillance continue",
      eyebrow: "Ventes + produits",
      title: "Vos données à jour après chaque import",
      description:
        "Tonnages recalculés en temps réel, écarts détectés automatiquement. Fini les surprises en fin d'année.",
      image: "/images/dashboard.png",
      mediaSide: "right",
    },
    {
      badge: "Alertes & contrôle",
      eyebrow: "Anomalies détectées",
      title: "Corrigez avant que ça ne coûte",
      description:
        "Produit sans poids ? Matière incohérente ? Klover le signale immédiatement avec une action corrective en 1 clic.",
      image: "/images/dashboard.png",
      mediaSide: "left",
    },
    {
      badge: "Preuves & conformité",
      eyebrow: "Audit trail",
      title: "Contrôle DGCCRF ? Vous êtes prêt.",
      description:
        "Chaque décision est horodatée et exportable. En cas d'audit, vous montrez des preuves — pas des tableurs.",
      image: "/images/dashboard.png",
      layout: "stacked",
    },
  ],
};

export const stepsSectionConfig = {
  id: "subscription",
  eyebrow: "Pourquoi l'abonnement",
  title: "Sans monitoring, vous redevenez aveugle",
  subtitle: "Vos produits, volumes et données changent en continu. La conformité aussi.",
  align: "left",
  stepsAlign: "left",
  steps: [
    {
      step: "01",
      eyebrow: "Nouveaux produits",
      title: "50 nouvelles réfs/mois = 50 risques potentiels",
      meta: "chaque mois",
      description:
        "Chaque produit ajouté sans classification crée un écart REP. Une seule erreur peut déclencher un redressement.",
    },
    {
      step: "02",
      eyebrow: "Volumes variables",
      title: "Vos contributions varient de ±20% par trimestre",
      meta: "toute l'année",
      description:
        "Sans suivi continu, vous surpayez en haute saison et sous-déclarez en basse saison. Les deux sont sanctionnables.",
      highlight: true,
    },
    {
      step: "03",
      eyebrow: "Preuves et traçabilité",
      title: "Un contrôleur ne veut pas un tableur d'il y a 3 mois",
      meta: "en continu",
      description:
        "L'audit trail doit être à jour au moment du contrôle. Sans abonnement actif, vous perdez cette preuve.",
    },
  ],
};
