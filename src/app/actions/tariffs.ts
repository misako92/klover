"use server";

import { requireOrgContext } from "@/lib/auth/context";
import {
  createDefaultTariffProfile,
  TARIFF_ECO_ORGANISMS,
  TARIFF_MATERIAL_TYPES,
  type TariffEcoOrganism,
} from "@/lib/compliance/tariff-config";
import { getActiveTariffProfilesMap } from "@/lib/compliance/tariff-profiles";

export async function getTariffWorkspace() {
  const { membership } = await requireOrgContext();
  const profiles = await getActiveTariffProfilesMap();

  return {
    currentRole: membership.role,
    ecoOrganisms: TARIFF_ECO_ORGANISMS,
    materialTypes: TARIFF_MATERIAL_TYPES,
    profiles: Object.fromEntries(
      TARIFF_ECO_ORGANISMS.map((ecoOrganism) => [
        ecoOrganism,
        profiles[ecoOrganism] ?? createDefaultTariffProfile(ecoOrganism),
      ]),
    ) as Record<TariffEcoOrganism, Awaited<ReturnType<typeof createDefaultTariffProfile>>>,
  };
}
