import "server-only";

import type { EcoOrganism, MaterialType, PackagingType } from "@prisma/client";
import { format } from "date-fns";

import { getActiveTariffProfilesMap } from "@/lib/compliance/tariff-profiles";
import prisma from "@/lib/db";
import { calculateCoopContribution } from "@/services/contribution";

interface ExportRow {
  sku: string | number;
  productName: string;
  materialLabel: string;
  packagingLabel: string;
  unitWeightG: number;
  quantitySold: number;
  totalWeightKg: string;
  ecoOrganismLabel: string;
  reusableLabel: string;
  reuseCount: number;
  classificationSourceLabel: string;
  confidencePercent: string | number;
  estimatedContributionEur: string;
  tariffVersionLabel: string;
  tariffEffectiveFrom: string;
}

const MATERIAL_LABELS: Record<MaterialType, string> = {
  PLASTIC: "Plastique",
  PLASTIC_PET: "Plastique PET",
  CARDBOARD: "Carton",
  GLASS: "Verre",
  ALUMINUM: "Aluminium",
  STEEL: "Acier",
  WOOD: "Bois",
  TEXTILE: "Textile",
  COMPOSITE: "Composite",
  UNKNOWN: "Inconnu",
};

const ECO_ORGANISM_LABELS: Record<EcoOrganism, string> = {
  CITEO: "CITEO",
  LEKO: "Leko",
  ECOMAISON: "Ecomaison",
  VALDELIA: "Valdelia",
  OTHER: "Autre",
};

const PACKAGING_TYPE_LABELS: Record<PackagingType, string> = {
  PRIMARY: "Primaire",
  SECONDARY: "Secondaire",
  TERTIARY: "Tertiaire",
};

const CLASSIFICATION_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manuelle",
  HEURISTIC: "Heuristique",
  RULE_BASED: "Regle",
  AI_SUGGESTION: "Suggestion IA",
  SHOPIFY_IMPORT: "Import Shopify",
  WOOCOMMERCE_IMPORT: "Import WooCommerce",
};

function getTodayLabel() {
  return format(new Date(), "yyyy-MM-dd");
}

function getExportScopeLabel(ecoOrganism?: EcoOrganism) {
  return ecoOrganism ? ecoOrganism.toLowerCase() : "global";
}

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits);
}

export async function generateExport(
  orgId: string,
  ecoOrganism?: EcoOrganism,
  effectiveAt?: Date,
): Promise<{ csv: string; filename: string; rowCount: number }> {
  // biome-ignore lint/suspicious/noExplicitAny: Prisma dynamic where condition typing bypass
  const where: any = { orgId, status: "CONFIRMED" };
  if (ecoOrganism) {
    where.ecoOrganism = ecoOrganism;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      name: true,
      sku: true,
      materialType: true,
      ecoOrganism: true,
      packagingType: true,
      isReusable: true,
      reuseCount: true,
      classificationSource: true,
      confidence: true,
      weightG: true,
      quantitySold: true,
    },
  });
  const tariffProfiles = await getActiveTariffProfilesMap(effectiveAt ?? new Date());

  const rows: ExportRow[] = products.map((product) => {
    const unitWeightG = product.weightG ?? 0;
    const quantitySold = product.quantitySold ?? 0;
    const totalWeightG = unitWeightG * quantitySold;
    const packagingType = product.packagingType ?? "PRIMARY";
    const isReusable = product.isReusable ?? false;
    const reuseCount = isReusable ? Math.max(product.reuseCount ?? 0, 0) : 0;
    const tariffProfile = product.ecoOrganism ? tariffProfiles[product.ecoOrganism] : undefined;
    const contributionCents =
      product.materialType && product.ecoOrganism
        ? calculateCoopContribution(
            totalWeightG,
            product.materialType,
            product.ecoOrganism,
            packagingType,
            isReusable,
            reuseCount,
            tariffProfile,
          )
        : 0;

    return {
      sku: product.sku || "-",
      productName: product.name,
      materialLabel: product.materialType ? MATERIAL_LABELS[product.materialType] : "Non classe",
      packagingLabel: PACKAGING_TYPE_LABELS[packagingType],
      unitWeightG,
      quantitySold,
      totalWeightKg: formatNumber(totalWeightG / 1000, 3),
      ecoOrganismLabel: product.ecoOrganism ? ECO_ORGANISM_LABELS[product.ecoOrganism] : "-",
      reusableLabel: isReusable ? "Oui" : "Non",
      reuseCount,
      classificationSourceLabel:
        CLASSIFICATION_SOURCE_LABELS[product.classificationSource ?? ""] ?? product.classificationSource ?? "-",
      confidencePercent:
        product.confidence != null && product.confidence > 0 ? Math.round(product.confidence * 100) : "-",
      estimatedContributionEur: formatNumber(contributionCents / 100),
      tariffVersionLabel: tariffProfile?.versionLabel ?? "REP Emballages 2026",
      tariffEffectiveFrom: tariffProfile?.effectiveFrom
        ? format(new Date(tariffProfile.effectiveFrom), "yyyy-MM-dd")
        : "2026-01-01",
    };
  });

  return {
    csv: generateCSVContent(rows),
    filename: `klover-export-${getExportScopeLabel(ecoOrganism)}-${getTodayLabel()}.csv`,
    rowCount: rows.length,
  };
}

function generateCSVContent(rows: ExportRow[]): string {
  const headers = [
    "SKU",
    "Nom produit",
    "Mat\u00e9riau",
    "Type d'emballage",
    "Poids unitaire (g)",
    "Quantit\u00e9 vendue",
    "Poids total (kg)",
    "\u00c9co-organisme",
    "R\u00e9emploi",
    "Rotations pr\u00e9vues",
    "Source de classification",
    "Confiance (%)",
    "Contribution estim\u00e9e (EUR)",
    "Version bareme",
    "Date effet bareme",
  ];

  const csvRows = rows.map((row) =>
    [
      escapeCSV(row.sku),
      escapeCSV(row.productName),
      escapeCSV(row.materialLabel),
      escapeCSV(row.packagingLabel),
      escapeCSV(row.unitWeightG),
      escapeCSV(row.quantitySold),
      escapeCSV(row.totalWeightKg),
      escapeCSV(row.ecoOrganismLabel),
      escapeCSV(row.reusableLabel),
      escapeCSV(row.reuseCount),
      escapeCSV(row.classificationSourceLabel),
      escapeCSV(row.confidencePercent),
      escapeCSV(row.estimatedContributionEur),
      escapeCSV(row.tariffVersionLabel),
      escapeCSV(row.tariffEffectiveFrom),
    ].join(";"),
  );

  return `\uFEFF${headers.join(";")}\r\n${csvRows.join("\r\n")}`;
}

function escapeCSV(value: string | number) {
  const stringValue = String(value);
  if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
