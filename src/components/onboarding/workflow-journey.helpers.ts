import type { ComplianceSnapshot, DeclarationRecord, ImportSessionRecord } from "@/features/compliance/data/types";

export type WorkflowStepState = "complete" | "current" | "upcoming";

export interface WorkflowStep {
  id: "import" | "review" | "declaration";
  title: string;
  description: string;
  href: string;
  state: WorkflowStepState;
}

export interface WorkflowAction {
  label: string;
  href: string;
  description: string;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getCurrentDeclaration(declarations: DeclarationRecord[], date: Date) {
  const currentMonth = monthKey(date);
  return declarations.find((declaration) => declaration.period === currentMonth) ?? null;
}

function getLatestCompletedImport(imports: ImportSessionRecord[]) {
  return (
    imports.filter((item) => item.status === "COMPLETED").sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0] ??
    null
  );
}

export function buildWorkflowSteps(
  compliance: ComplianceSnapshot,
  imports: ImportSessionRecord[],
  declarations: DeclarationRecord[],
  date = new Date(),
): WorkflowStep[] {
  const latestImport = getLatestCompletedImport(imports);
  const currentDeclaration = getCurrentDeclaration(declarations, date);

  const importDone = !compliance.missingImportCurrentMonth;
  const reviewDone = compliance.needsReviewCount === 0;
  const declarationDone = !compliance.declarationToPrepare;

  return [
    {
      id: "import",
      title: "Importer les ventes",
      description: importDone
        ? latestImport
          ? `Dernier import traite le ${formatDateLabel(latestImport.importedAt)}.`
          : "Les ventes du mois courant sont deja chargees."
        : "Chargez le CSV du mois pour alimenter le catalogue.",
      href: "/dashboard/orders",
      state: importDone ? "complete" : "current",
    },
    {
      id: "review",
      title: "Verifier le catalogue",
      description: reviewDone
        ? "Les produits exploitables sont classes et prets pour la suite."
        : `${compliance.needsReviewCount} produit${compliance.needsReviewCount > 1 ? "s" : ""} restent a completer ou valider.`,
      href: "/dashboard/products?tab=review",
      state: reviewDone ? "complete" : importDone ? "current" : "upcoming",
    },
    {
      id: "declaration",
      title: "Preparer la declaration",
      description: declarationDone
        ? "La declaration du mois courant est deja soumise."
        : currentDeclaration
          ? "Un brouillon est deja disponible pour la periode en cours."
          : "Creez le brouillon puis exportez le fichier de depot.",
      href: "/dashboard/declarations",
      state: declarationDone ? "complete" : importDone && reviewDone ? "current" : "upcoming",
    },
  ];
}

export function getPrimaryWorkflowAction(steps: WorkflowStep[]): WorkflowAction {
  const currentStep = steps.find((step) => step.state === "current");

  if (!currentStep) {
    return {
      label: "Ouvrir le tableau de bord",
      href: "/dashboard/default",
      description: "Le parcours principal du mois est deja couvert.",
    };
  }

  if (currentStep.id === "import") {
    return {
      label: "Importer le CSV du mois",
      href: currentStep.href,
      description: "Commencez par charger vos ventes recentes.",
    };
  }

  if (currentStep.id === "review") {
    return {
      label: "Verifier les produits a risque",
      href: currentStep.href,
      description: "Finalisez les produits incomplets avant declaration.",
    };
  }

  return {
    label: "Ouvrir les declarations",
    href: currentStep.href,
    description: "Generez ou finalisez le brouillon du mois en cours.",
  };
}

export function getWorkflowCompletionPercent(steps: WorkflowStep[]) {
  const completeCount = steps.filter((step) => step.state === "complete").length;
  return Math.round((completeCount / steps.length) * 100);
}
