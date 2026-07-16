import { describe, expect, it } from "vitest";

import {
  buildWorkflowSteps,
  getPrimaryWorkflowAction,
  getWorkflowCompletionPercent,
} from "../workflow-journey.helpers";

describe("workflow journey helpers", () => {
  it("prioritizes import when the current month is still missing", () => {
    const steps = buildWorkflowSteps(
      {
        status: "RISK",
        statusLabel: "Risque",
        needsReviewCount: 12,
        missingImportCurrentMonth: true,
        declarationToPrepare: true,
        isIduMissing: false,
        alerts: [],
        nextActions: [],
      },
      [],
      [],
      new Date("2026-02-28T10:00:00.000Z"),
    );

    expect(steps.map((step) => step.state)).toEqual(["current", "upcoming", "upcoming"]);
    expect(getPrimaryWorkflowAction(steps)).toEqual({
      label: "Importer le CSV du mois",
      href: "/dashboard/orders",
      description: "Commencez par charger vos ventes recentes.",
    });
    expect(getWorkflowCompletionPercent(steps)).toBe(0);
  });

  it("moves to declaration once imports are done and products are clean", () => {
    const steps = buildWorkflowSteps(
      {
        status: "ACTIONS_REQUIRED",
        statusLabel: "Actions requises",
        needsReviewCount: 0,
        missingImportCurrentMonth: false,
        declarationToPrepare: true,
        isIduMissing: false,
        alerts: [],
        nextActions: [],
      },
      [
        {
          id: "imp-1",
          fileName: "ventes-fevrier.csv",
          importedAt: "2026-02-12T09:00:00.000Z",
          period: "2026-02",
          status: "COMPLETED",
          rowCount: 180,
          createdProducts: 12,
          updatedProducts: 168,
          errorCount: 0,
          mapping: { sku: "sku", name: "name", quantity: "qty" },
        },
      ],
      [
        {
          id: "decl-1",
          period: "2026-02",
          ecoOrganism: "CITEO",
          status: "DRAFT",
          estimatedAmountEur: 120,
          totalTonnageKg: 80,
          generatedAt: "2026-02-20T10:00:00.000Z",
          submittedAt: null,
        },
      ],
      new Date("2026-02-28T10:00:00.000Z"),
    );

    expect(steps.map((step) => step.state)).toEqual(["complete", "complete", "current"]);
    expect(getPrimaryWorkflowAction(steps)).toEqual({
      label: "Ouvrir les declarations",
      href: "/dashboard/declarations",
      description: "Generez ou finalisez le brouillon du mois en cours.",
    });
    expect(getWorkflowCompletionPercent(steps)).toBe(67);
  });
});
