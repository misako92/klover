import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Klover",
  version: packageJson.version,
  copyright: `© ${currentYear}, Klover.`,
  meta: {
    title: "Klover - Conformité Loi AGEC / REP",
    description:
      "Plateforme de gestion de conformité AGEC & REP pour les producteurs. Suivi des mises en marché, éco-contributions et déclarations.",
  },
};
