import { createDefaultTariffProfilesMap } from "@/lib/compliance/tariff-config";

import { computeContributionEur, inferEcoOrganism, normalizeConfidence } from "./constants";
import type { DeclarationRecord, LocalDb, MaterialType, ProductRecord } from "./types";

const PRODUCT_NAME_PREFIXES = [
  "Pack",
  "Kit",
  "Lot",
  "Serie",
  "Boite",
  "Format",
  "Eco",
  "Standard",
  "Premium",
  "Essentiel",
];

const PRODUCT_NAME_ITEMS = [
  "Bouteille PET 500ml",
  "Boite carton expedition",
  "Bocal verre 250ml",
  "Canette aluminium 33cl",
  "T-shirt coton",
  "Palette bois",
  "Pochette plastique",
  "Etui carton slim",
  "Capsule aluminium",
  "Sachet textile",
  "Emballage composite",
  "Flacon pompe",
  "Boite acier",
  "Enveloppe papier",
  "Lot de chaussettes",
];

const MATERIAL_POOL: MaterialType[] = [
  "PLASTIC_PET",
  "PLASTIC",
  "CARDBOARD",
  "GLASS",
  "ALUMINUM",
  "STEEL",
  "WOOD",
  "TEXTILE",
  "COMPOSITE",
];

function seeded(seed: number) {
  const x = Math.sin(seed * 97.173) * 10000;
  return x - Math.floor(x);
}

function seededInt(seed: number, min: number, max: number) {
  return Math.floor(seeded(seed) * (max - min + 1)) + min;
}

function getPackagingType(index: number): "PRIMARY" | "SECONDARY" | "TERTIARY" {
  const r = index % 10;
  if (r < 7) return "PRIMARY";
  if (r < 9) return "SECONDARY";
  return "TERTIARY";
}

function getReusability(index: number): { isReusable: boolean; reuseCount: number } {
  if (index % 7 === 0) return { isReusable: true, reuseCount: (index % 8) + 1 };
  return { isReusable: false, reuseCount: 0 };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function createSeedProducts(now: Date) {
  const createdAt = new Date(now.getFullYear(), now.getMonth() - 2, 5).toISOString();
  const products: ProductRecord[] = [];

  for (let index = 0; index < 300; index += 1) {
    const sku = `KLV-${String(10000 + index).padStart(5, "0")}`;
    const prefix = PRODUCT_NAME_PREFIXES[index % PRODUCT_NAME_PREFIXES.length];
    const item = PRODUCT_NAME_ITEMS[index % PRODUCT_NAME_ITEMS.length];
    const name = `${prefix} ${item}`;

    const quantitySold = seededInt(index + 11, 8, 420);
    const isReview = index >= 270;

    if (isReview) {
      const reusability = getReusability(index);
      products.push({
        id: `prod-${index + 1}`,
        sku,
        name,
        quantitySold,
        materialType: null,
        weightG: null,
        ecoOrganism: null,
        confidence: normalizeConfidence(0.45 + seeded(index + 17) * 0.25),
        status: "TO_REVIEW",
        classificationSource: "HEURISTIC",
        reviewReason: index % 2 === 0 ? "Matiere non detectee" : "Poids unitaire manquant",
        packagingType: getPackagingType(index),
        isReusable: reusability.isReusable,
        reuseCount: reusability.reuseCount,
        createdAt,
        updatedAt: createdAt,
      });
      continue;
    }

    const materialType = MATERIAL_POOL[index % MATERIAL_POOL.length];
    const weightG = seededInt(index + 31, 40, 950);
    const confidence = normalizeConfidence(0.83 + seeded(index + 57) * 0.16);
    const reusability = getReusability(index);

    products.push({
      id: `prod-${index + 1}`,
      sku,
      name,
      quantitySold,
      materialType,
      weightG,
      ecoOrganism: inferEcoOrganism(materialType),
      confidence,
      status: "CLASSIFIED",
      classificationSource: index % 5 === 0 ? "MANUAL" : "HEURISTIC",
      packagingType: getPackagingType(index),
      isReusable: reusability.isReusable,
      reuseCount: reusability.reuseCount,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return products;
}

function declarationAmount(products: ProductRecord[], period: string): DeclarationRecord {
  const tariffProfiles = createDefaultTariffProfilesMap();

  const totalEur = products.reduce((sum, product) => {
    return (
      sum +
      computeContributionEur({
        weightG: product.weightG ?? 0,
        quantity: product.quantitySold,
        materialType: product.materialType ?? "UNKNOWN",
        ecoOrganism: product.ecoOrganism ?? "CITEO",
        packagingType: product.packagingType ?? "PRIMARY",
        isReusable: product.isReusable ?? false,
        reuseCount: product.reuseCount ?? 0,
        tariffProfiles,
      })
    );
  }, 0);

  const totalKg = products.reduce((sum, product) => {
    if (!product.weightG) return sum;
    return sum + (product.weightG * product.quantitySold) / 1000;
  }, 0);

  return {
    id: `decl-${period}`,
    period,
    ecoOrganism: "CITEO",
    status: "DRAFT",
    estimatedAmountEur: Math.round(totalEur * 100) / 100,
    totalTonnageKg: Math.round(totalKg * 100) / 100,
    tariffVersionLabel: tariffProfiles.CITEO?.versionLabel,
    tariffEffectiveFrom: tariffProfiles.CITEO?.effectiveFrom ?? null,
    generatedAt: new Date().toISOString(),
    submittedAt: null,
  };
}

function createSeedDeclarations(products: ProductRecord[], now: Date): DeclarationRecord[] {
  const currentPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const current = declarationAmount(products, monthKey(currentPeriodDate));
  const previous = declarationAmount(products, monthKey(previousPeriodDate));

  previous.status = "SUBMITTED";
  previous.submittedAt = new Date(now.getFullYear(), now.getMonth(), 8).toISOString();

  return [current, previous];
}

export function createSeedDb(now = new Date()): LocalDb {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true" || process.env.MOCK_MODE === "true";
  const createdAt = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const tariffProfiles = createDefaultTariffProfilesMap();

  if (!isMockMode) {
    return {
      version: 1,
      createdAt,
      updatedAt: createdAt,
      products: [],
      imports: [],
      declarations: [],
      settings: {
        importSources: { csvEnabled: true, shopifyPlanned: false, amazonPlanned: false },
        modulation: { status: "PLANNED", note: "" },
        tariffProfiles,
      },
    };
  }

  const products = createSeedProducts(now);
  const currentPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    version: 1,
    createdAt,
    updatedAt: createdAt,
    products,
    imports: [
      {
        id: "imp-1",
        fileName: `ventes-${monthKey(previousPeriodDate)}.csv`,
        importedAt: new Date(now.getFullYear(), now.getMonth() - 1, 4, 10, 22).toISOString(),
        period: monthKey(previousPeriodDate),
        status: "COMPLETED",
        rowCount: 184,
        createdProducts: 62,
        updatedProducts: 118,
        errorCount: 4,
        mapping: {
          sku: "sku",
          name: "name",
          quantity: "quantity",
          date: "date",
        },
      },
      {
        id: "imp-2",
        fileName: `ventes-${monthKey(currentPeriodDate)}.csv`,
        importedAt: new Date(now.getFullYear(), now.getMonth(), 3, 9, 45).toISOString(),
        period: monthKey(currentPeriodDate),
        status: "COMPLETED",
        rowCount: 216,
        createdProducts: 40,
        updatedProducts: 170,
        errorCount: 6,
        mapping: {
          sku: "SKU",
          name: "Nom produit",
          quantity: "Quantite",
          price: "Prix",
          date: "Date",
        },
      },
    ],
    declarations: createSeedDeclarations(products, now),
    settings: {
      importSources: {
        csvEnabled: true,
        shopifyPlanned: true,
        amazonPlanned: true,
      },
      modulation: {
        status: "PLANNED",
        note: "Module de modulation en preparation. Les calculs affiches sont estimes et auditables.",
      },
      tariffProfiles,
    },
  };
}
