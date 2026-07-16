import type { EcoOrganism, MaterialType, PackagingType } from "@prisma/client";

import {
  calculateContributionCentsFromConfig,
  createDefaultTariffProfile,
  type TariffProfileSnapshot,
} from "@/lib/compliance/tariff-config";

export function calculateCoopContribution(
  weightG: number,
  material: MaterialType,
  ecoOrganism: EcoOrganism,
  packagingType: PackagingType = "PRIMARY",
  isReusable = false,
  reuseCount = 0,
  tariffProfile?: TariffProfileSnapshot,
): number {
  if (weightG == null || material == null || ecoOrganism == null) {
    return 0;
  }

  const profile = tariffProfile ?? createDefaultTariffProfile(ecoOrganism);

  return calculateContributionCentsFromConfig({
    weightG,
    materialType: material,
    packagingType,
    isReusable,
    reuseCount,
    config: profile.config,
  });
}

export function simulateContribution(
  products: {
    weightG?: number | null;
    materialType?: MaterialType | null;
    ecoOrganism?: EcoOrganism | null;
    packagingType?: PackagingType | null;
    isReusable?: boolean | null;
    reuseCount?: number | null;
    quantitySold?: number | null;
  }[],
  options?: {
    tariffProfiles?: Partial<Record<EcoOrganism, TariffProfileSnapshot>>;
  },
) {
  let totalCents = 0;
  let totalWeightG = 0;

  const breakdown = {
    byMaterial: {} as Record<string, number>,
    byOrganism: {} as Record<string, number>,
    byPackagingType: {} as Record<string, number>,
  };

  for (const product of products) {
    if (product.weightG == null || product.materialType == null || product.ecoOrganism == null) {
      continue;
    }

    const quantity = Number(product.quantitySold ?? 0);
    if (!Number.isFinite(quantity) || quantity < 0) {
      continue;
    }

    const totalProductWeightG = product.weightG * quantity;
    const packagingType = product.packagingType ?? "PRIMARY";
    const tariffProfile = options?.tariffProfiles?.[product.ecoOrganism];

    const fee = calculateCoopContribution(
      totalProductWeightG,
      product.materialType,
      product.ecoOrganism,
      packagingType,
      product.isReusable ?? false,
      product.reuseCount ?? 0,
      tariffProfile,
    );

    totalCents += fee;
    totalWeightG += totalProductWeightG;

    breakdown.byMaterial[product.materialType] = (breakdown.byMaterial[product.materialType] || 0) + fee;
    breakdown.byOrganism[product.ecoOrganism] = (breakdown.byOrganism[product.ecoOrganism] || 0) + fee;
    breakdown.byPackagingType[packagingType] = (breakdown.byPackagingType[packagingType] || 0) + fee;
  }

  return { totalCents, totalWeightG, breakdown };
}
