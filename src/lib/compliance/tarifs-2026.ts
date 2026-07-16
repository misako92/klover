import type { TariffMaterialType, TariffPackagingType } from "@/lib/compliance/tariff-config";
import {
  createDefaultTariffProfile,
  getTariffEurPerKg as getSharedTariffEurPerKg,
  type TariffConfig,
} from "@/lib/compliance/tariff-config";

export type MaterialType = TariffMaterialType;

const defaultProfile = createDefaultTariffProfile("CITEO");

export const TARIFS_MENAGERS_2026 = defaultProfile.config.primaryEurPerKg;
export const TARIFS_PROS_2026 = defaultProfile.config.proEurPerKg;

export function getTarifEurPerKg(
  materialType: MaterialType,
  packagingType: TariffPackagingType,
  config?: TariffConfig,
): number {
  return getSharedTariffEurPerKg(materialType, packagingType, config ?? defaultProfile.config);
}
