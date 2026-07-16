import type { TariffProfileSnapshot } from "@/lib/compliance/tariff-config";

export const STORAGE_KEY = "klover.local-db.v1";
export const DB_VERSION = 1;

export type MaterialType =
  | "PLASTIC_PET"
  | "PLASTIC"
  | "CARDBOARD"
  | "GLASS"
  | "ALUMINUM"
  | "STEEL"
  | "WOOD"
  | "TEXTILE"
  | "COMPOSITE"
  | "UNKNOWN";

export type EcoOrganism = "CITEO" | "LEKO" | "ECOMAISON" | "VALDELIA" | "OTHER";

export type ProductStatus = "CLASSIFIED" | "TO_REVIEW";
// Mirrors Prisma's PackagingType enum — remove this alias when migrating to @prisma/client
export type PackagingType = "PRIMARY" | "SECONDARY" | "TERTIARY";

export type DeclarationStatus = "DRAFT" | "SUBMITTED";

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  quantitySold: number;
  materialType: MaterialType | null;
  weightG: number | null;
  ecoOrganism: EcoOrganism | null;
  packagingType: PackagingType;
  isReusable: boolean;
  reuseCount: number;
  confidence?: number;
  status: ProductStatus;
  classificationSource:
    | "MANUAL"
    | "HEURISTIC"
    | "RULE_BASED"
    | "AI_SUGGESTION"
    | "SHOPIFY_IMPORT"
    | "WOOCOMMERCE_IMPORT";
  reviewReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSessionRecord {
  id: string;
  fileName: string;
  importedAt: string;
  period: string;
  status: "COMPLETED" | "FAILED";
  rowCount: number;
  createdProducts: number;
  updatedProducts: number;
  errorCount: number;
  mapping: CsvMapping;
}

export interface DeclarationRecord {
  id: string;
  period: string;
  ecoOrganism: EcoOrganism;
  status: DeclarationStatus;
  estimatedAmountEur: number;
  totalTonnageKg: number;
  tariffVersionLabel?: string;
  tariffEffectiveFrom?: string | null;
  generatedAt: string;
  submittedAt: string | null;
}

export interface LocalSettings {
  importSources: {
    csvEnabled: boolean;
    shopifyPlanned: boolean;
    amazonPlanned: boolean;
  };
  modulation: {
    status: "NOT_CONFIGURED" | "PLANNED";
    note: string;
  };
  idu?: string;
  tariffProfiles?: Partial<Record<EcoOrganism, TariffProfileSnapshot>>;
}

export interface LocalDb {
  version: number;
  createdAt: string;
  updatedAt: string;
  products: ProductRecord[];
  imports: ImportSessionRecord[];
  declarations: DeclarationRecord[];
  settings: LocalSettings;
}

export interface CsvMapping {
  sku: string;
  name: string;
  quantity: string;
  price?: string;
  date?: string;
}

export interface ParsedImportRow {
  sku: string;
  name: string;
  quantity: number;
  raw: Record<string, string>;
}

export interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportRunInput {
  fileName: string;
  csvText: string;
  mapping: CsvMapping;
}

export interface ImportRunResult {
  session: ImportSessionRecord;
  importedLines: number;
  createdProducts: number;
  updatedProducts: number;
  errors: string[];
}

export interface ComplianceAlert {
  id: string;
  severity: "low" | "medium" | "high";
  label: string;
  description: string;
  href: string;
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface ComplianceSnapshot {
  status: "COMPLIANT" | "ACTIONS_REQUIRED" | "RISK";
  statusLabel: string;
  needsReviewCount: number;
  missingImportCurrentMonth: boolean;
  declarationToPrepare: boolean;
  isIduMissing: boolean;
  alerts: ComplianceAlert[];
  nextActions: NextAction[];
}

export interface KpiSummary {
  totalTonnageKg: number;
  classifiedRate: number;
  estimatedContributionEur: number;
  missingDataCount: number;
  assumptionsCount: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  valueEur: number;
  percent: number;
}

export interface TopContributor {
  id: string;
  sku: string;
  name: string;
  contributionEur: number;
  materialType: MaterialType;
  ecoOrganism: EcoOrganism;
}

export interface ReusabilityStats {
  totalReusableItems: number;
  totalSingleUseItems: number;
  reusablePercent: number;
  avgReuseCount: number;
}

export interface AnalyticsSnapshot {
  byMaterial: BreakdownItem[];
  byOrganism: BreakdownItem[];
  byPackagingType: BreakdownItem[];
  reusabilityStats: ReusabilityStats;
  topContributors: TopContributor[];
  dominantMaterial: BreakdownItem | null;
  dominantOrganism: BreakdownItem | null;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
}

export interface ProductRepo {
  list(filters?: ProductFilters): Promise<ProductRecord[]>;
  updateClassification(
    productId: string,
    update: {
      materialType: MaterialType;
      weightG: number;
      ecoOrganism: EcoOrganism;
      confidence?: number;
      source?: "MANUAL" | "HEURISTIC" | "RULE_BASED";
      packagingType?: PackagingType;
      isReusable?: boolean;
      reuseCount?: number;
    },
  ): Promise<ProductRecord>;
  bulkMarkClassified(productIds: string[]): Promise<number>;
  delete: (productId: string) => Promise<void>;
  bulkDelete: (productIds: string[]) => Promise<number>;
  generateAISuggestions: (productIds: string[]) => Promise<{ count: number; suggestions: any[] }>;
}

export interface ImportRepo {
  list(): Promise<ImportSessionRecord[]>;
  runImport(input: ImportRunInput): Promise<ImportRunResult>;
}

export interface ComplianceRepo {
  getDeclarations(): Promise<DeclarationRecord[]>;
  createCurrentMonthDraft(): Promise<DeclarationRecord | null>;
  submitDeclaration(declarationId: string): Promise<DeclarationRecord>;
  buildDeclarationExport(declarationId: string): Promise<{ fileName: string; csv: string }>;
  getComplianceSnapshot(): Promise<ComplianceSnapshot>;
  saveIdu(idu: string): Promise<void>;
}

export interface AnalyticsRepo {
  getKpis(): Promise<KpiSummary>;
  getAnalyticsSnapshot(): Promise<AnalyticsSnapshot>;
}

export interface LocalRepositories {
  productRepo: ProductRepo;
  importRepo: ImportRepo;
  complianceRepo: ComplianceRepo;
  analyticsRepo: AnalyticsRepo;
  readDb(): LocalDb;
  resetDb(): LocalDb;
}
