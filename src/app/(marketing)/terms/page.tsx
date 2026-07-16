import { SectionWrapper } from "@/components/marketing/layout/SectionWrapper";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Klover",
  description: "CGU de la plateforme Klover.",
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-white">
      <SectionWrapper id="terms" className="pt-24 pb-16 md:pt-32" maxWidth="max-w-3xl">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-700 text-xs">
            Juridique
          </div>
          <h1 className="mb-4 font-bold text-3xl text-slate-900 tracking-tight md:text-4xl">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : 13 février 2026</p>
        </div>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-li:text-slate-600 prose-p:text-slate-600">
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de
            la plateforme Klover, éditée par Klover SAS. Klover propose un outil SaaS de monitoring et de gestion de la
            conformité AGEC/REP pour les entreprises e-commerce.
          </p>

          <h2>2. Acceptation des CGU</h2>
          <p>
            L&apos;utilisation de la plateforme implique l&apos;acceptation sans réserve des présentes CGU.
            L&apos;utilisateur déclare avoir pris connaissance des présentes conditions avant toute utilisation du
            service.
          </p>

          <h2>3. Description du service</h2>
          <p>Klover permet aux utilisateurs de :</p>
          <ul>
            <li>Importer des données de ventes (CSV, Shopify, WooCommerce)</li>
            <li>Classifier les produits par matériaux et filières REP</li>
            <li>Calculer les éco-contributions estimées</li>
            <li>Générer des exports conformes pour les éco-organismes</li>
            <li>Maintenir un audit trail horodaté des décisions de conformité</li>
          </ul>

          <h2>4. Comptes et accès</h2>
          <p>
            L&apos;accès au service nécessite la création d&apos;un compte utilisateur. L&apos;utilisateur est
            responsable de la confidentialité de ses identifiants et de toutes les actions effectuées via son compte.
          </p>

          <h2>5. Données et confidentialité</h2>
          <p>
            Les données importées sur Klover restent la propriété exclusive de l&apos;utilisateur. Klover s&apos;engage
            à ne pas exploiter ces données à des fins commerciales autres que la fourniture du service. Pour plus de
            détails, consultez notre{" "}
            <a href="/privacy" className="text-emerald-600 underline">
              politique de confidentialité
            </a>
            .
          </p>

          <h2>6. Tarification et paiement</h2>
          <p>
            Les tarifs applicables sont ceux affichés sur la page de tarification au moment de la souscription. Les
            abonnements sont facturés mensuellement. L&apos;utilisateur peut modifier ou résilier son abonnement à tout
            moment depuis son espace de facturation.
          </p>

          <h2>7. Responsabilité</h2>
          <p>
            Klover fournit un outil d&apos;aide à la conformité. Les calculs, classifications et exports générés sont
            des estimations basées sur les données fournies par l&apos;utilisateur. Klover ne se substitue pas à un
            conseil juridique et ne garantit pas la conformité réglementaire de l&apos;utilisateur.
          </p>

          <h2>8. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments constituant la plateforme Klover (code, design, contenus, marques) sont
            protégés par les lois de propriété intellectuelle et restent la propriété exclusive de Klover SAS.
          </p>

          <h2>9. Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU, vous pouvez nous contacter à{" "}
            <a href="mailto:contact@klover.co" className="text-emerald-600 underline">
              contact@klover.co
            </a>
            .
          </p>
        </div>
      </SectionWrapper>
    </main>
  );
}
