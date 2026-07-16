import { normalizeSku } from "@/lib/sku";

import { classifyByHeuristics } from "./classification";
import { computeContributionEur, inferEcoOrganism, MATERIAL_LABELS, ORGANISM_LABELS, round } from "./constants";
import { parseMappedCsvRows } from "./csv";
import { readLocalDb, resetLocalDb, writeLocalDb } from "./storage";
import type {
  AnalyticsRepo,
  AnalyticsSnapshot,
  BreakdownItem,
  ComplianceAlert,
  ComplianceRepo,
  ComplianceSnapshot,
  DeclarationRecord,
  ImportRepo,
  ImportRunInput,
  ImportRunResult,
  KpiSummary,
  LocalDb,
  LocalRepositories,
  MaterialType,
  NextAction,
  ProductRepo,
  ProductStatus,
  TopContributor,
} from "./types";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nowMonthKey() {
  return monthKey(new Date());
}

function formatMaterialLabel(material: string) {
  return MATERIAL_LABELS[material as MaterialType] ?? material;
}

export function buildKpis(db: LocalDb): KpiSummary {
  const classified = db.products.filter((product) => product.status === "CLASSIFIED");
  const totalProducts = db.products.length;
  const classifiedRate = totalProducts > 0 ? round((classified.length / totalProducts) * 100, 1) : 0;

  const totalTonnageKg = classified.reduce((sum, product) => {
    if (!product.weightG) return sum;
    return sum + (product.weightG * product.quantitySold) / 1000;
  }, 0);

  let estimatedContributionEur = 0;
  for (const product of db.products) {
    if (product.status === "CLASSIFIED") {
      estimatedContributionEur += computeContributionEur({
        weightG: product.weightG ?? 0,
        quantity: product.quantitySold,
        materialType: product.materialType ?? "UNKNOWN",
        ecoOrganism: product.ecoOrganism,
        packagingType: product.packagingType ?? "PRIMARY",
        isReusable: product.isReusable ?? false,
        reuseCount: product.reuseCount ?? 0,
        tariffProfiles: db.settings.tariffProfiles,
      });
      continue;
    }

    // Missing data assumptions for products still in review.
    estimatedContributionEur += computeContributionEur({
      weightG: 150,
      quantity: product.quantitySold,
      materialType: "UNKNOWN",
      ecoOrganism: product.ecoOrganism ?? "CITEO",
      packagingType: "PRIMARY",
      isReusable: false,
      reuseCount: 0,
      tariffProfiles: db.settings.tariffProfiles,
    });
  }

  const missingDataCount = db.products.filter((product) => product.status === "TO_REVIEW").length;
  const assumptionsCount = db.products.filter((product) => product.status === "TO_REVIEW").length;

  return {
    totalTonnageKg: round(totalTonnageKg, 2),
    classifiedRate,
    estimatedContributionEur: round(estimatedContributionEur, 2),
    missingDataCount,
    assumptionsCount,
  };
}

function toBreakdown(map: Record<string, number>, formatter?: (key: string) => string): BreakdownItem[] {
  const total = Object.values(map).reduce((sum, value) => sum + value, 0);
  const list = Object.entries(map)
    .map(([key, value]) => ({
      key,
      label: formatter ? formatter(key) : key,
      valueEur: round(value, 2),
      percent: total > 0 ? round((value / total) * 100, 1) : 0,
    }))
    .sort((a, b) => b.valueEur - a.valueEur);

  return list;
}

export function buildAnalytics(db: LocalDb): AnalyticsSnapshot {
  const byMaterial: Record<string, number> = {};
  const byOrganism: Record<string, number> = {};
  const byPackagingType: Record<string, number> = {};
  const contributors: TopContributor[] = [];

  let totalReusableItems = 0;
  let totalSingleUseItems = 0;
  let totalReuseCycles = 0;

  for (const product of db.products) {
    if (!product.materialType || !product.ecoOrganism) continue;

    const contribution = computeContributionEur({
      weightG: product.weightG ?? 0,
      quantity: product.quantitySold,
      materialType: product.materialType ?? "UNKNOWN",
      ecoOrganism: product.ecoOrganism,
      packagingType: product.packagingType,
      isReusable: product.isReusable,
      reuseCount: product.reuseCount,
      tariffProfiles: db.settings.tariffProfiles,
    });

    if (contribution <= 0) continue;

    byMaterial[product.materialType] = (byMaterial[product.materialType] ?? 0) + contribution;
    byOrganism[product.ecoOrganism] = (byOrganism[product.ecoOrganism] ?? 0) + contribution;

    // Grouping for the 2026 Packaging Type
    const pkgTypeKey = product.packagingType || "PRIMARY";
    byPackagingType[pkgTypeKey] = (byPackagingType[pkgTypeKey] ?? 0) + contribution;

    if (product.isReusable) {
      totalReusableItems += product.quantitySold;
      totalReuseCycles += (product.reuseCount || 1) * product.quantitySold;
    } else {
      totalSingleUseItems += product.quantitySold;
    }

    contributors.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      contributionEur: round(contribution, 2),
      materialType: product.materialType,
      ecoOrganism: product.ecoOrganism,
    });
  }

  const byMaterialList = toBreakdown(byMaterial, formatMaterialLabel);
  const byOrganismList = toBreakdown(byOrganism, (key) => ORGANISM_LABELS[key as keyof typeof ORGANISM_LABELS] ?? key);

  const packagingTypeLabels: Record<string, string> = {
    PRIMARY: "Primaire (Ménager)",
    SECONDARY: "Secondaire (Pro)",
    TERTIARY: "Tertiaire (Pro)",
  };
  const byPackagingTypeList = toBreakdown(byPackagingType, (key) => packagingTypeLabels[key] || key);

  const totalItemsCount = totalReusableItems + totalSingleUseItems;
  const reusabilityStats = {
    totalReusableItems,
    totalSingleUseItems,
    reusablePercent: totalItemsCount > 0 ? round((totalReusableItems / totalItemsCount) * 100, 1) : 0,
    avgReuseCount: totalReusableItems > 0 ? round(totalReuseCycles / totalReusableItems, 1) : 0,
  };

  return {
    byMaterial: byMaterialList,
    byOrganism: byOrganismList,
    byPackagingType: byPackagingTypeList,
    reusabilityStats,
    topContributors: contributors.sort((a, b) => b.contributionEur - a.contributionEur).slice(0, 12),
    dominantMaterial: byMaterialList[0] ?? null,
    dominantOrganism: byOrganismList[0] ?? null,
  };
}

function buildComplianceSnapshot(db: LocalDb): ComplianceSnapshot {
  const month = nowMonthKey();
  const needsReviewCount = db.products.filter((product) => product.status === "TO_REVIEW").length;
  const missingImportCurrentMonth = !db.imports.some(
    (session) => session.period === month && session.status === "COMPLETED",
  );

  const currentDeclaration = db.declarations.find((declaration) => declaration.period === month);
  const declarationToPrepare = !currentDeclaration || currentDeclaration.status === "DRAFT";

  const isIduMissing = !db.settings?.idu;

  const alerts: ComplianceAlert[] = [];

  if (isIduMissing) {
    alerts.push({
      id: "missing-idu",
      severity: "high",
      label: "Numéro IDU obligatoire manquant",
      description: "Votre Identifiant Unique (IDU) est requis pour prouver la conformité légale de votre boutique.",
      href: "/dashboard/settings",
    });
  }

  if (needsReviewCount > 0) {
    alerts.push({
      id: "review-products",
      severity: needsReviewCount > 20 ? "high" : "medium",
      label: `${needsReviewCount} produits à vérifier`,
      description: "Matière, poids ou organisme manquants: contribution estimée avec hypothèses.",
      href: "/dashboard/products?tab=review",
    });
  }

  if (missingImportCurrentMonth) {
    alerts.push({
      id: "missing-import",
      severity: "high",
      label: "Import du mois courant manquant",
      description: "Aucun flux de ventes n'a été importé pour la période en cours.",
      href: "/dashboard/orders",
    });
  }

  if (declarationToPrepare) {
    alerts.push({
      id: "declaration-draft",
      severity: "medium",
      label: "Déclaration à préparer",
      description: "La période en cours n'a pas de déclaration soumise.",
      href: "/dashboard/declarations",
    });
  }

  let status: ComplianceSnapshot["status"] = "COMPLIANT";
  if (missingImportCurrentMonth || needsReviewCount >= 25 || isIduMissing) {
    status = "RISK";
  } else if (needsReviewCount > 0 || declarationToPrepare) {
    status = "ACTIONS_REQUIRED";
  }

  const nextActions: NextAction[] = [];

  if (missingImportCurrentMonth) {
    nextActions.push({
      id: "action-import",
      title: "Importer les ventes du mois",
      description: "Chargez un CSV pour couvrir la période courante.",
      href: "/dashboard/orders",
    });
  }

  if (needsReviewCount > 0) {
    nextActions.push({
      id: "action-classify",
      title: "Classer les produits en risque",
      description: "Traitez les produits non classifiés ou à faible confiance.",
      href: "/dashboard/products?tab=review",
    });
  }

  if (declarationToPrepare) {
    nextActions.push({
      id: "action-declaration",
      title: "Préparer la déclaration",
      description: "Validez le brouillon puis exportez le fichier de déclaration.",
      href: "/dashboard/declarations",
    });
  }

  if (nextActions.length < 3) {
    nextActions.push({
      id: "action-analytics",
      title: "Contrôler la répartition des contributions",
      description: "Vérifiez la matière et l'organisme dominant pour anticiper les écarts.",
      href: "/dashboard/analytics",
    });
  }

  return {
    status,
    statusLabel: status === "COMPLIANT" ? "Conforme" : status === "ACTIONS_REQUIRED" ? "Actions requises" : "Risque",
    needsReviewCount,
    missingImportCurrentMonth,
    declarationToPrepare,
    isIduMissing,
    alerts: alerts.slice(0, 3),
    nextActions: nextActions.slice(0, 3),
  };
}

function declarationFromDb(db: LocalDb, period: string): DeclarationRecord {
  const totals = db.products.reduce(
    (acc, product) => {
      const contribution = computeContributionEur({
        weightG: product.weightG ?? 0,
        quantity: product.quantitySold,
        materialType: product.materialType ?? "UNKNOWN",
        ecoOrganism: product.ecoOrganism ?? "CITEO",
        packagingType: product.packagingType ?? "PRIMARY",
        isReusable: product.isReusable ?? false,
        reuseCount: product.reuseCount ?? 0,
        tariffProfiles: db.settings.tariffProfiles,
      });
      acc.estimatedAmountEur += contribution;

      if (product.weightG) {
        acc.totalTonnageKg += (product.weightG * product.quantitySold) / 1000;
      }

      return acc;
    },
    { estimatedAmountEur: 0, totalTonnageKg: 0 },
  );

  return {
    id: `decl-${period}-${Date.now()}`,
    period,
    ecoOrganism: "CITEO",
    status: "DRAFT",
    estimatedAmountEur: round(totals.estimatedAmountEur, 2),
    totalTonnageKg: round(totals.totalTonnageKg, 2),
    tariffVersionLabel: db.settings.tariffProfiles?.CITEO?.versionLabel,
    tariffEffectiveFrom: db.settings.tariffProfiles?.CITEO?.effectiveFrom ?? null,
    generatedAt: new Date().toISOString(),
    submittedAt: null,
  };
}

function generateDeclarationCsv(db: LocalDb, declaration: DeclarationRecord) {
  const headers = [
    "SKU",
    "Nom produit",
    "Matiere",
    "Poids unitaire (g)",
    "Quantite vendue",
    "Tonnage (kg)",
    "Eco-organisme",
    "Contribution estimee (EUR)",
    "Periode",
    "Version bareme",
  ];

  const rows = db.products
    .filter((product) => product.status === "CLASSIFIED")
    .map((product) => {
      const contribution = computeContributionEur({
        weightG: product.weightG ?? 0,
        quantity: product.quantitySold,
        materialType: product.materialType ?? "UNKNOWN",
        ecoOrganism: product.ecoOrganism ?? declaration.ecoOrganism,
        packagingType: product.packagingType ?? "PRIMARY",
        isReusable: product.isReusable ?? false,
        reuseCount: product.reuseCount ?? 0,
        tariffProfiles: db.settings.tariffProfiles,
      });
      const tonnage = product.weightG ? round((product.weightG * product.quantitySold) / 1000, 2) : 0;
      return [
        product.sku,
        product.name,
        product.materialType,
        product.weightG ?? "",
        product.quantitySold,
        tonnage,
        product.ecoOrganism,
        contribution.toFixed(2),
        declaration.period,
        declaration.tariffVersionLabel ?? "",
      ]
        .map((value) => String(value).replaceAll(";", ","))
        .join(";");
    });

  return `\uFEFF${headers.join(";")}\n${rows.join("\n")}`;
}

export function createLocalRepositories(): LocalRepositories {
  const readDb = () => readLocalDb();

  const persist = (db: LocalDb) => writeLocalDb(db);

  const productRepo: ProductRepo = {
    async list(filters) {
      const db = readDb();
      return db.products.filter((product) => {
        if (filters?.status && product.status !== filters.status) {
          return false;
        }

        if (filters?.search) {
          const query = filters.search.trim().toLowerCase();
          if (!query) return true;
          return product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
        }

        return true;
      });
    },

    async updateClassification(productId, update) {
      const db = readDb();
      const index = db.products.findIndex((product) => product.id === productId);
      if (index < 0) {
        throw new Error("Produit introuvable");
      }

      const current = db.products[index];
      const next = {
        ...current,
        materialType: update.materialType,
        weightG: update.weightG,
        ecoOrganism: update.ecoOrganism,
        confidence: update.confidence ?? 0.95,
        classificationSource: update.source ?? "MANUAL",
        status: "CLASSIFIED" as ProductStatus,
        reviewReason: undefined,
        packagingType: update.packagingType ?? current.packagingType,
        isReusable: update.isReusable ?? current.isReusable,
        reuseCount: update.reuseCount ?? current.reuseCount,
        updatedAt: new Date().toISOString(),
      };

      db.products[index] = next;
      persist(db);

      return next;
    },

    async bulkMarkClassified(productIds) {
      if (productIds.length === 0) {
        return 0;
      }

      const db = readDb();
      const targets = new Set(productIds);
      let updatedCount = 0;

      db.products = db.products.map((product) => {
        if (!targets.has(product.id)) {
          return product;
        }

        updatedCount += 1;

        const materialType = product.materialType ?? "CARDBOARD";
        const ecoOrganism = product.ecoOrganism ?? inferEcoOrganism(materialType);
        const weightG = product.weightG ?? 150;

        return {
          ...product,
          materialType,
          ecoOrganism,
          weightG,
          confidence: (product.confidence ?? 0) < 0.8 ? 0.8 : (product.confidence ?? 0.8),
          status: "CLASSIFIED",
          classificationSource: "MANUAL",
          reviewReason: undefined,
          updatedAt: new Date().toISOString(),
        };
      });

      persist(db);
      return updatedCount;
    },

    async delete(productId) {
      const db = readDb();
      const initialLength = db.products.length;
      db.products = db.products.filter((p) => p.id !== productId);

      if (db.products.length !== initialLength) {
        persist(db);
      }
    },

    async bulkDelete(productIds) {
      if (productIds.length === 0) return 0;

      const db = readDb();
      const targets = new Set(productIds);
      const initialLength = db.products.length;

      db.products = db.products.filter((p) => !targets.has(p.id));

      const deletedCount = initialLength - db.products.length;
      if (deletedCount > 0) {
        persist(db);
      }

      return deletedCount;
    },

    async generateAISuggestions(productIds: string[]) {
      if (!productIds || productIds.length === 0) return { count: 0, suggestions: [] };

      const db = readDb();
      const targets = new Set(productIds);
      let updatedCount = 0;
      const suggestions: any[] = [];

      db.products = db.products.map((product) => {
        if (!targets.has(product.id)) {
          return product;
        }

        const name = product.name.toLowerCase();
        let suggestedMaterial: MaterialType = "CARDBOARD";
        const suggestedOrganism = "CITEO";
        let suggestedPackaging: "PRIMARY" | "SECONDARY" | "TERTIARY" = "PRIMARY";
        let suggestedWeight = 150;
        let confidence = 0.65;
        let reason = "Analyse générique basée sur la catégorie d'emballage par défaut.";

        if (name.includes("verre") || name.includes("bouteille") || name.includes("pot")) {
          suggestedMaterial = "GLASS";
          suggestedWeight = 350;
          confidence = 0.92;
          reason = "Détection du mot-clé 'verre' ou 'bouteille'. Gisement lourd estimé.";
        } else if (
          name.includes("plastique") ||
          name.includes("sachet") ||
          name.includes("film") ||
          name.includes("poly")
        ) {
          suggestedMaterial = "PLASTIC";
          suggestedWeight = 45;
          confidence = 0.88;
          reason = "Emballage plastique léger ou film détecté via l'intitulé.";
        } else if (name.includes("carton") || name.includes("boîte") || name.includes("kraft")) {
          suggestedMaterial = "CARDBOARD";
          suggestedPackaging = "SECONDARY";
          suggestedWeight = 120;
          confidence = 0.85;
          reason = "Classification probable en emballage d'expédition (Secondaire).";
        }

        updatedCount += 1;

        suggestions.push({
          id: product.id,
          materialType: suggestedMaterial,
          ecoOrganism: suggestedOrganism,
          packagingType: suggestedPackaging,
          weightG: suggestedWeight,
          confidence,
          reason,
        });

        return {
          ...product,
          materialType: suggestedMaterial,
          ecoOrganism: "CITEO" as any,
          packagingType: suggestedPackaging,
          weightG: suggestedWeight,
          confidence,
          status: "TO_REVIEW",
          classificationSource: "AI_SUGGESTION",
          reviewReason: reason,
          updatedAt: new Date().toISOString(),
        };
      });

      persist(db);
      return { count: updatedCount, suggestions };
    },
  };

  const importRepo: ImportRepo = {
    async list() {
      const db = readDb();
      return [...db.imports].sort((a, b) => b.importedAt.localeCompare(a.importedAt));
    },

    async runImport(input: ImportRunInput): Promise<ImportRunResult> {
      const db = readDb();
      const parsed = parseMappedCsvRows(input.csvText, input.mapping);
      const errors = [...parsed.errors];
      let createdProducts = 0;
      let updatedProducts = 0;

      for (const row of parsed.rows) {
        const normalizedSku = normalizeSku(row.sku);
        if (!normalizedSku) {
          errors.push(`SKU invalide pour ${row.name}`);
          continue;
        }

        const existing = db.products.find((product) => normalizeSku(product.sku) === normalizedSku);

        if (existing) {
          existing.quantitySold += row.quantity;
          existing.updatedAt = new Date().toISOString();
          updatedProducts += 1;
          continue;
        }

        const heuristic = classifyByHeuristics({ name: row.name, sku: normalizedSku });
        const createdAt = new Date().toISOString();
        const status: ProductStatus = heuristic && heuristic.confidence >= 0.8 ? "CLASSIFIED" : "TO_REVIEW";

        const productId = `prod-${db.products.length + 1}`;
        db.products.push({
          id: productId,
          sku: normalizedSku,
          name: row.name,
          quantitySold: row.quantity,
          materialType: heuristic?.materialType ?? null,
          weightG: heuristic ? 150 : null,
          ecoOrganism: heuristic?.ecoOrganism ?? null,
          confidence: heuristic?.confidence ?? 0.48,
          status,
          classificationSource: heuristic ? "HEURISTIC" : "MANUAL",
          reviewReason: status === "TO_REVIEW" ? "Classification auto insuffisante" : undefined,
          packagingType: "PRIMARY",
          isReusable: false,
          reuseCount: 0,
          createdAt,
          updatedAt: createdAt,
        });
        createdProducts += 1;
      }

      const importedAt = new Date();
      const session = {
        id: `imp-${Date.now()}`,
        fileName: input.fileName,
        importedAt: importedAt.toISOString(),
        period: nowMonthKey(),
        status: parsed.rows.length > 0 ? ("COMPLETED" as const) : ("FAILED" as const),
        rowCount: parsed.rows.length,
        createdProducts,
        updatedProducts,
        errorCount: errors.length,
        mapping: input.mapping,
      };

      db.imports.unshift(session);
      persist(db);

      return {
        session,
        importedLines: parsed.rows.length,
        createdProducts,
        updatedProducts,
        errors,
      };
    },
  };

  const complianceRepo: ComplianceRepo = {
    async getDeclarations() {
      const db = readDb();
      return [...db.declarations].sort((a, b) => b.period.localeCompare(a.period));
    },

    async createCurrentMonthDraft() {
      const db = readDb();
      const period = nowMonthKey();
      const existing = db.declarations.find((declaration) => declaration.period === period);
      if (existing) {
        return null;
      }

      const draft = declarationFromDb(db, period);
      db.declarations.unshift(draft);
      persist(db);
      return draft;
    },

    async submitDeclaration(declarationId: string) {
      const db = readDb();
      const declaration = db.declarations.find((entry) => entry.id === declarationId);
      if (!declaration) {
        throw new Error("Déclaration introuvable");
      }

      declaration.status = "SUBMITTED";
      declaration.submittedAt = new Date().toISOString();
      persist(db);
      return declaration;
    },

    async buildDeclarationExport(declarationId: string) {
      const db = readDb();
      const declaration = db.declarations.find((entry) => entry.id === declarationId);
      if (!declaration) {
        throw new Error("Déclaration introuvable");
      }

      const csv = generateDeclarationCsv(db, declaration);
      const fileName = `klover-declaration-${declaration.period}.csv`;
      return { fileName, csv };
    },

    async getComplianceSnapshot() {
      const db = readDb();
      return buildComplianceSnapshot(db);
    },

    async saveIdu(idu: string) {
      const db = readDb();
      if (!db.settings) {
        db.settings = {
          importSources: { csvEnabled: true, shopifyPlanned: true, amazonPlanned: false },
          modulation: { status: "PLANNED", note: "" },
        };
      }
      db.settings.idu = idu;
      persist(db);
    },
  };

  const analyticsRepo: AnalyticsRepo = {
    async getKpis() {
      return buildKpis(readDb());
    },

    async getAnalyticsSnapshot() {
      return buildAnalytics(readDb());
    },
  };

  return {
    productRepo,
    importRepo,
    complianceRepo,
    analyticsRepo,
    readDb,
    resetDb: () => {
      return resetLocalDb();
    },
  };
}

export function buildDashboardSnapshots(db: LocalDb) {
  return {
    kpis: buildKpis(db),
    analytics: buildAnalytics(db),
    compliance: buildComplianceSnapshot(db),
  };
}
