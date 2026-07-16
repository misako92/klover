import { z } from "zod";

export const TARIFF_ECO_ORGANISMS = ["CITEO", "LEKO", "ECOMAISON", "VALDELIA", "OTHER"] as const;
export const TARIFF_MATERIAL_TYPES = [
  "PLASTIC_PET",
  "PLASTIC",
  "CARDBOARD",
  "GLASS",
  "ALUMINUM",
  "STEEL",
  "WOOD",
  "TEXTILE",
  "COMPOSITE",
  "UNKNOWN",
] as const;
export const TARIFF_PACKAGING_TYPES = ["PRIMARY", "SECONDARY", "TERTIARY"] as const;

export type TariffEcoOrganism = (typeof TARIFF_ECO_ORGANISMS)[number];
export type TariffMaterialType = (typeof TARIFF_MATERIAL_TYPES)[number];
export type TariffPackagingType = (typeof TARIFF_PACKAGING_TYPES)[number];

const tariffRateRecordSchema = z.object({
  PLASTIC_PET: z.number().nonnegative(),
  PLASTIC: z.number().nonnegative(),
  CARDBOARD: z.number().nonnegative(),
  GLASS: z.number().nonnegative(),
  ALUMINUM: z.number().nonnegative(),
  STEEL: z.number().nonnegative(),
  WOOD: z.number().nonnegative(),
  TEXTILE: z.number().nonnegative(),
  COMPOSITE: z.number().nonnegative(),
  UNKNOWN: z.number().nonnegative(),
});

export const tariffConfigSchema = z.object({
  primaryEurPerKg: tariffRateRecordSchema,
  proEurPerKg: tariffRateRecordSchema,
  reusableDiscountPerReusePct: z.number().min(0).max(100),
  reusableDiscountCapPct: z.number().min(0).max(100),
});

export type TariffConfig = z.infer<typeof tariffConfigSchema>;

export interface TariffProfileSnapshot {
  id?: string;
  ecoOrganism: TariffEcoOrganism;
  versionLabel: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
  isActive: boolean;
  source: "database" | "fallback";
  updatedAt?: string;
  config: TariffConfig;
}

export const DEFAULT_TARIFF_EFFECTIVE_FROM = "2026-01-01T00:00:00.000Z";
export const DEFAULT_TARIFF_VERSION_LABEL = "REP Emballages 2026";

const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  primaryEurPerKg: {
    PLASTIC_PET: 0.54,
    PLASTIC: 0.62,
    CARDBOARD: 0.24,
    GLASS: 0.17,
    ALUMINUM: 0.41,
    STEEL: 0.31,
    WOOD: 0.18,
    TEXTILE: 0.58,
    COMPOSITE: 0.72,
    UNKNOWN: 0.95,
  },
  proEurPerKg: {
    PLASTIC_PET: 0.28,
    PLASTIC: 0.32,
    CARDBOARD: 0.12,
    GLASS: 0.09,
    ALUMINUM: 0.22,
    STEEL: 0.16,
    WOOD: 0.09,
    TEXTILE: 0.3,
    COMPOSITE: 0.38,
    UNKNOWN: 0.5,
  },
  reusableDiscountPerReusePct: 5,
  reusableDiscountCapPct: 50,
};

tariffConfigSchema.parse(DEFAULT_TARIFF_CONFIG);

export function cloneTariffConfig(config: TariffConfig): TariffConfig {
  return {
    primaryEurPerKg: { ...config.primaryEurPerKg },
    proEurPerKg: { ...config.proEurPerKg },
    reusableDiscountPerReusePct: config.reusableDiscountPerReusePct,
    reusableDiscountCapPct: config.reusableDiscountCapPct,
  };
}

export function createDefaultTariffProfile(
  ecoOrganism: TariffEcoOrganism,
  overrides?: Partial<Pick<TariffProfileSnapshot, "versionLabel" | "effectiveFrom" | "effectiveTo" | "notes">>,
): TariffProfileSnapshot {
  return {
    ecoOrganism,
    versionLabel: overrides?.versionLabel ?? DEFAULT_TARIFF_VERSION_LABEL,
    effectiveFrom: overrides?.effectiveFrom ?? DEFAULT_TARIFF_EFFECTIVE_FROM,
    effectiveTo: overrides?.effectiveTo ?? null,
    notes: overrides?.notes ?? "Profil par defaut embarque dans l'application.",
    isActive: true,
    source: "fallback",
    config: cloneTariffConfig(DEFAULT_TARIFF_CONFIG),
  };
}

export function createDefaultTariffProfilesMap(): Partial<Record<TariffEcoOrganism, TariffProfileSnapshot>> {
  return Object.fromEntries(
    TARIFF_ECO_ORGANISMS.map((ecoOrganism) => [ecoOrganism, createDefaultTariffProfile(ecoOrganism)]),
  ) as Partial<Record<TariffEcoOrganism, TariffProfileSnapshot>>;
}

export function normalizeTariffMaterialType(materialType?: string | null): TariffMaterialType {
  switch (materialType) {
    case "PLASTIC_PET":
    case "PLASTIC":
    case "CARDBOARD":
    case "GLASS":
    case "ALUMINUM":
    case "STEEL":
    case "WOOD":
    case "TEXTILE":
    case "COMPOSITE":
    case "UNKNOWN":
      return materialType;
    default:
      return "UNKNOWN";
  }
}

export function getTariffEurPerKg(
  materialType: string,
  packagingType: TariffPackagingType,
  config: TariffConfig = DEFAULT_TARIFF_CONFIG,
): number {
  const normalized = normalizeTariffMaterialType(materialType);
  const rateTable = packagingType === "PRIMARY" ? config.primaryEurPerKg : config.proEurPerKg;
  return rateTable[normalized] ?? rateTable.UNKNOWN;
}

export function calculateReusableDiscountRatio(config: TariffConfig, isReusable: boolean, reuseCount: number): number {
  if (!isReusable) {
    return 0;
  }

  const perReuseRatio = config.reusableDiscountPerReusePct / 100;
  const capRatio = config.reusableDiscountCapPct / 100;
  return Math.min(Math.max(reuseCount, 0) * perReuseRatio, capRatio);
}

export function calculateContributionEurFromConfig(input: {
  weightG: number;
  materialType: string;
  packagingType?: TariffPackagingType | null;
  isReusable?: boolean | null;
  reuseCount?: number | null;
  config?: TariffConfig;
}): number {
  const config = input.config ?? DEFAULT_TARIFF_CONFIG;
  const packagingType = input.packagingType ?? "PRIMARY";
  const ratePerKg = getTariffEurPerKg(input.materialType, packagingType, config);
  const baseAmountEur = (input.weightG / 1000) * ratePerKg;
  const discountRatio = calculateReusableDiscountRatio(config, input.isReusable ?? false, input.reuseCount ?? 0);
  return baseAmountEur * (1 - discountRatio);
}

export function calculateContributionCentsFromConfig(input: {
  weightG: number;
  materialType: string;
  packagingType?: TariffPackagingType | null;
  isReusable?: boolean | null;
  reuseCount?: number | null;
  config?: TariffConfig;
}): number {
  return Math.round(calculateContributionEurFromConfig(input) * 100);
}
