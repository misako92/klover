import {
  calculateContributionEurFromConfig,
  createDefaultTariffProfile,
  getTariffEurPerKg,
  type TariffProfileSnapshot,
} from "@/lib/compliance/tariff-config";

import type { EcoOrganism, MaterialType } from "./types";

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  PLASTIC_PET: "Plastique PET",
  PLASTIC: "Plastique",
  CARDBOARD: "Carton / Papier",
  GLASS: "Verre",
  ALUMINUM: "Aluminium",
  STEEL: "Acier",
  WOOD: "Bois",
  TEXTILE: "Textile",
  COMPOSITE: "Composite",
  UNKNOWN: "Inconnu",
};

export const ORGANISM_LABELS: Record<EcoOrganism, string> = {
  CITEO: "CITEO",
  LEKO: "Leko",
  ECOMAISON: "Ecomaison",
  VALDELIA: "Valdelia",
  OTHER: "Autre",
};

export const TARIFFS_EUR_PER_KG: Record<MaterialType, number> =
  createDefaultTariffProfile("CITEO").config.primaryEurPerKg;

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeConfidence(value: number) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function inferEcoOrganism(material: MaterialType): EcoOrganism {
  if (material === "WOOD") return "VALDELIA";
  if (material === "TEXTILE") return "ECOMAISON";
  if (material === "COMPOSITE") return "LEKO";
  return "CITEO";
}

interface ContributionInput {
  materialType: MaterialType;
  weightG: number;
  quantity: number;
  ecoOrganism?: EcoOrganism | null;
  packagingType: "PRIMARY" | "SECONDARY" | "TERTIARY";
  isReusable: boolean;
  reuseCount: number;
  tariffProfiles?: Partial<Record<EcoOrganism, TariffProfileSnapshot>>;
}

export function computeContributionEur({
  materialType,
  weightG,
  quantity,
  ecoOrganism,
  packagingType,
  isReusable,
  reuseCount,
  tariffProfiles,
}: ContributionInput): number {
  const profile =
    (ecoOrganism ? tariffProfiles?.[ecoOrganism] : undefined) ?? createDefaultTariffProfile(ecoOrganism ?? "CITEO");

  const contribution = calculateContributionEurFromConfig({
    weightG: weightG * quantity,
    materialType,
    packagingType,
    isReusable,
    reuseCount,
    config: profile.config,
  });

  return round(contribution, 4);
}

export function getConfiguredTariffEurPerKg(
  materialType: MaterialType,
  packagingType: "PRIMARY" | "SECONDARY" | "TERTIARY",
  ecoOrganism: EcoOrganism,
  tariffProfiles?: Partial<Record<EcoOrganism, TariffProfileSnapshot>>,
) {
  const profile = tariffProfiles?.[ecoOrganism] ?? createDefaultTariffProfile(ecoOrganism);
  return getTariffEurPerKg(materialType, packagingType, profile.config);
}
