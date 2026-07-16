"use client";

import * as React from "react";

import { getComplianceDashboardState, runCsvImport, saveOrganizationIdu } from "@/app/actions/compliance-dashboard";
import { createDeclaration, submitDeclaration as submitDeclarationAction } from "@/app/actions/declarations";
import { exportData } from "@/app/actions/export";
import {
  bulkDeleteProducts as bulkDeleteProductsAction,
  deleteProduct as deleteProductAction,
  updateProductClassification as updateProductClassificationAction,
} from "@/app/actions/products";
import { inferEcoOrganism } from "@/features/compliance/data/constants";
import { buildDashboardSnapshots, createLocalRepositories } from "@/features/compliance/data/repositories";
import type {
  AnalyticsSnapshot,
  ComplianceSnapshot,
  DeclarationRecord,
  EcoOrganism,
  ImportRunInput,
  ImportRunResult,
  KpiSummary,
  LocalDb,
  LocalRepositories,
  MaterialType,
  PackagingType,
  ProductRecord,
} from "@/features/compliance/data/types";
import { createDefaultTariffProfilesMap } from "@/lib/compliance/tariff-config";
import { generateAISuggestions as generateAISuggestionsAction } from "@/services/ai-classification";

interface ComplianceDataContextValue {
  ready: boolean;
  isMockMode: boolean;
  db: LocalDb;
  products: ProductRecord[];
  declarations: DeclarationRecord[];
  imports: LocalDb["imports"];
  kpis: KpiSummary;
  analytics: AnalyticsSnapshot;
  compliance: ComplianceSnapshot;
  refresh: () => void;
  runImport: (input: ImportRunInput) => Promise<ImportRunResult>;
  updateProductClassification: (args: {
    productId: string;
    materialType: MaterialType;
    weightG: number;
    ecoOrganism: EcoOrganism;
    confidence?: number;
    packagingType?: PackagingType;
    isReusable?: boolean;
    reuseCount?: number;
  }) => Promise<ProductRecord>;
  bulkMarkClassified: (productIds: string[]) => Promise<number>;
  generateAISuggestions: (productIds: string[]) => Promise<number>;
  deleteProduct: (productId: string) => Promise<void>;
  bulkDeleteProducts: (productIds: string[]) => Promise<number>;
  createCurrentMonthDraft: () => Promise<DeclarationRecord | null>;
  submitDeclaration: (declarationId: string) => Promise<DeclarationRecord>;
  exportDeclaration: (declarationId: string) => Promise<{ fileName: string; csv: string }>;
  resetMockData: () => void;
  saveIdu: (idu: string) => Promise<void>;
  isClassifying: boolean;
  classificationProgress: number;
  pctMenager: number;
  pctPro: number;
  pctReusable: number;
  reusableCount: number;
}

const ComplianceDataContext = React.createContext<ComplianceDataContextValue | null>(null);

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE
  ? process.env.NEXT_PUBLIC_MOCK_MODE === "true"
  : process.env.NODE_ENV !== "production";

function createEmptyDb(): LocalDb {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    products: [],
    imports: [],
    declarations: [],
    settings: {
      importSources: {
        csvEnabled: true,
        shopifyPlanned: false,
        amazonPlanned: false,
      },
      modulation: {
        status: "PLANNED",
        note: "",
      },
      tariffProfiles: createDefaultTariffProfilesMap(),
    },
  };
}

function getInitialDb(repos: LocalRepositories): LocalDb {
  return IS_MOCK_MODE ? repos.readDb() : createEmptyDb();
}

export function ComplianceDataProvider({ children }: { children: React.ReactNode }) {
  const repositoriesRef = React.useRef<LocalRepositories | null>(null);
  if (!repositoriesRef.current) {
    repositoriesRef.current = createLocalRepositories();
  }

  const repositories = repositoriesRef.current;

  const [ready, setReady] = React.useState(false);
  const [db, setDb] = React.useState<LocalDb>(() => getInitialDb(repositories));
  const [isClassifying, setIsClassifying] = React.useState(false);
  const [classificationProgress, setClassificationProgress] = React.useState(0);

  const refreshData = React.useCallback(async () => {
    const nextDb = IS_MOCK_MODE ? repositories.readDb() : await getComplianceDashboardState();
    setDb(nextDb);
    return nextDb;
  }, [repositories]);

  const refresh = React.useCallback(() => {
    void refreshData();
  }, [refreshData]);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextDb = IS_MOCK_MODE ? repositories.readDb() : await getComplianceDashboardState();
        if (!cancelled) {
          setDb(nextDb);
        }
      } catch (error) {
        console.error("Failed to load compliance dashboard state", error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [repositories]);

  const snapshots = React.useMemo(() => buildDashboardSnapshots(db), [db]);

  const runImport = React.useCallback(
    async (input: ImportRunInput) => {
      const result = IS_MOCK_MODE ? await repositories.importRepo.runImport(input) : await runCsvImport(input);
      await refreshData();
      return result;
    },
    [repositories, refreshData],
  );

  const updateProductClassification = React.useCallback(
    async (args: {
      productId: string;
      materialType: MaterialType;
      weightG: number;
      ecoOrganism: EcoOrganism;
      confidence?: number;
      packagingType?: PackagingType;
      isReusable?: boolean;
      reuseCount?: number;
    }) => {
      if (IS_MOCK_MODE) {
        const result = await repositories.productRepo.updateClassification(args.productId, {
          materialType: args.materialType,
          weightG: args.weightG,
          ecoOrganism: args.ecoOrganism,
          confidence: args.confidence,
          packagingType: args.packagingType,
          isReusable: args.isReusable,
          reuseCount: args.reuseCount,
        });
        await refreshData();
        return result;
      }

      await updateProductClassificationAction(args.productId, {
        materialType: args.materialType,
        ecoOrganism: args.ecoOrganism,
        packagingType: args.packagingType,
        isReusable: args.isReusable,
        reuseCount: args.reuseCount,
        weightG: args.weightG,
        status: "CONFIRMED",
      });

      const nextDb = await refreshData();
      const updatedProduct = nextDb.products.find((product) => product.id === args.productId);
      if (!updatedProduct) {
        throw new Error("Produit introuvable après mise à jour.");
      }

      return updatedProduct;
    },
    [repositories, refreshData],
  );

  const bulkMarkClassified = React.useCallback(
    async (productIds: string[]) => {
      setIsClassifying(true);
      setClassificationProgress(0);

      try {
        let processed = 0;
        const total = productIds.length;
        const batchSize = IS_MOCK_MODE ? 1 : 5;

        for (let i = 0; i < total; i += batchSize) {
          const batch = productIds.slice(i, i + batchSize);

          if (IS_MOCK_MODE) {
            await repositories.productRepo.bulkMarkClassified(batch);
            await refreshData();
            await new Promise((resolve) => setTimeout(resolve, 150));
          } else {
            for (const productId of batch) {
              const product = db.products.find((item) => item.id === productId);
              if (!product) {
                continue;
              }

              const materialType = product.materialType ?? "CARDBOARD";
              const ecoOrganism = product.ecoOrganism ?? inferEcoOrganism(materialType);

              await updateProductClassificationAction(product.id, {
                materialType,
                ecoOrganism,
                packagingType: product.packagingType ?? "PRIMARY",
                isReusable: product.isReusable ?? false,
                reuseCount: product.isReusable ? Math.max(product.reuseCount ?? 1, 1) : 0,
                weightG: product.weightG ?? 180,
                status: "CONFIRMED",
              });
            }
          }

          processed += batch.length;
          setClassificationProgress(Math.round((processed / total) * 100));
        }

        if (!IS_MOCK_MODE) {
          await refreshData();
        }

        return total;
      } finally {
        setIsClassifying(false);
        setClassificationProgress(0);
      }
    },
    [db.products, repositories, refreshData],
  );

  const generateAISuggestions = React.useCallback(
    async (productIds: string[]) => {
      setIsClassifying(true);
      setClassificationProgress(0);

      try {
        const { count } = IS_MOCK_MODE
          ? await repositories.productRepo.generateAISuggestions(productIds)
          : await generateAISuggestionsAction(productIds);

        await refreshData();
        await new Promise((resolve) => setTimeout(resolve, IS_MOCK_MODE ? 800 : 300));

        return count;
      } finally {
        setIsClassifying(false);
        setClassificationProgress(0);
      }
    },
    [repositories, refreshData],
  );

  const deleteProduct = React.useCallback(
    async (productId: string) => {
      if (IS_MOCK_MODE) {
        await repositories.productRepo.delete(productId);
      } else {
        await deleteProductAction(productId);
      }
      await refreshData();
    },
    [repositories, refreshData],
  );

  const bulkDeleteProducts = React.useCallback(
    async (productIds: string[]) => {
      const count = IS_MOCK_MODE
        ? await repositories.productRepo.bulkDelete(productIds)
        : (await bulkDeleteProductsAction(productIds)).deletedCount;
      await refreshData();
      return count;
    },
    [repositories, refreshData],
  );

  const createCurrentMonthDraft = React.useCallback(async () => {
    if (IS_MOCK_MODE) {
      const result = await repositories.complianceRepo.createCurrentMonthDraft();
      await refreshData();
      return result;
    }

    try {
      const created = await createDeclaration(new Date(), "CITEO");
      const nextDb = await refreshData();
      return nextDb.declarations.find((declaration) => declaration.id === created.id) ?? null;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("existe")) {
        return null;
      }
      throw error;
    }
  }, [repositories, refreshData]);

  const submitDeclaration = React.useCallback(
    async (declarationId: string) => {
      if (IS_MOCK_MODE) {
        const result = await repositories.complianceRepo.submitDeclaration(declarationId);
        await refreshData();
        return result;
      }

      await submitDeclarationAction(declarationId);
      const nextDb = await refreshData();
      const declaration = nextDb.declarations.find((entry) => entry.id === declarationId);
      if (!declaration) {
        throw new Error("Déclaration introuvable après soumission.");
      }

      return declaration;
    },
    [repositories, refreshData],
  );

  const exportDeclaration = React.useCallback(
    async (declarationId: string) => {
      if (IS_MOCK_MODE) {
        return repositories.complianceRepo.buildDeclarationExport(declarationId);
      }

      const declaration = db.declarations.find((entry) => entry.id === declarationId);
      if (!declaration) {
        throw new Error("Déclaration introuvable.");
      }

      const effectiveAt = declaration.tariffEffectiveFrom ?? `${declaration.period}-01`;
      const result = await exportData(declaration.ecoOrganism, effectiveAt);
      return {
        fileName: result.filename,
        csv: result.csv,
      };
    },
    [db.declarations, repositories],
  );

  const resetMockData = React.useCallback(() => {
    if (IS_MOCK_MODE) {
      const nextDb = repositories.resetDb();
      setDb(nextDb);
      return;
    }

    void refreshData();
  }, [repositories, refreshData]);

  const saveIdu = React.useCallback(
    async (idu: string) => {
      if (IS_MOCK_MODE) {
        await repositories.complianceRepo.saveIdu(idu);
      } else {
        await saveOrganizationIdu(idu);
      }
      await refreshData();
    },
    [repositories, refreshData],
  );

  const totalWeightG = db.products.reduce((sum, product) => sum + (product.weightG ?? 0), 0);
  const menagerWeightG = db.products
    .filter((product) => (product.packagingType ?? "PRIMARY") === "PRIMARY")
    .reduce((sum, product) => sum + (product.weightG ?? 0), 0);
  const pctMenager = totalWeightG > 0 ? Math.round((menagerWeightG / totalWeightG) * 100) : 0;
  const pctPro = 100 - pctMenager;

  const reusableCount = db.products.filter((product) => product.isReusable).length;
  const pctReusable = db.products.length > 0 ? Math.round((reusableCount / db.products.length) * 100) : 0;

  const value = React.useMemo<ComplianceDataContextValue>(
    () => ({
      ready,
      isMockMode: IS_MOCK_MODE,
      db,
      products: db.products,
      declarations: db.declarations,
      imports: db.imports,
      kpis: snapshots.kpis,
      analytics: snapshots.analytics,
      compliance: snapshots.compliance,
      refresh,
      runImport,
      updateProductClassification,
      bulkMarkClassified,
      generateAISuggestions,
      deleteProduct,
      bulkDeleteProducts,
      createCurrentMonthDraft,
      submitDeclaration,
      exportDeclaration,
      resetMockData,
      saveIdu,
      isClassifying,
      classificationProgress,
      pctMenager,
      pctPro,
      pctReusable,
      reusableCount,
    }),
    [
      ready,
      db,
      snapshots,
      refresh,
      runImport,
      updateProductClassification,
      bulkMarkClassified,
      generateAISuggestions,
      deleteProduct,
      bulkDeleteProducts,
      createCurrentMonthDraft,
      submitDeclaration,
      exportDeclaration,
      resetMockData,
      saveIdu,
      isClassifying,
      classificationProgress,
      pctMenager,
      pctPro,
      pctReusable,
      reusableCount,
    ],
  );

  return <ComplianceDataContext.Provider value={value}>{children}</ComplianceDataContext.Provider>;
}

export function useComplianceData() {
  const context = React.useContext(ComplianceDataContext);
  if (!context) {
    throw new Error("useComplianceData must be used inside ComplianceDataProvider");
  }
  return context;
}
