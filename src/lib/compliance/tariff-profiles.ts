import "server-only";

import type { EcoOrganism } from "@prisma/client";

import {
  createDefaultTariffProfile,
  createDefaultTariffProfilesMap,
  type TariffEcoOrganism,
  type TariffProfileSnapshot,
  tariffConfigSchema,
} from "@/lib/compliance/tariff-config";
import prisma from "@/lib/db";

function toTariffEcoOrganism(ecoOrganism: EcoOrganism): TariffEcoOrganism {
  return ecoOrganism;
}

function resolveTariffConfig(rawRates: unknown, fallback: TariffProfileSnapshot["config"]) {
  const parsed = tariffConfigSchema.safeParse(rawRates);
  return parsed.success ? parsed.data : fallback;
}

function isEffectiveForDate(profile: { effectiveFrom: Date; effectiveTo: Date | null }, targetDate: Date) {
  return profile.effectiveFrom <= targetDate && (!profile.effectiveTo || profile.effectiveTo >= targetDate);
}

export async function getActiveTariffProfilesMap(
  effectiveAt = new Date(),
): Promise<Partial<Record<TariffEcoOrganism, TariffProfileSnapshot>>> {
  const rows = await prisma.tariffProfile.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ ecoOrganism: "asc" }, { effectiveFrom: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      ecoOrganism: true,
      versionLabel: true,
      effectiveFrom: true,
      effectiveTo: true,
      isActive: true,
      notes: true,
      rates: true,
      updatedAt: true,
    },
  });

  const defaults = createDefaultTariffProfilesMap();
  const byOrganism: Partial<Record<TariffEcoOrganism, TariffProfileSnapshot>> = { ...defaults };

  for (const ecoOrganism of Object.keys(defaults) as TariffEcoOrganism[]) {
    const defaultProfile = defaults[ecoOrganism] ?? createDefaultTariffProfile(ecoOrganism);
    const candidates = rows.filter((row) => row.ecoOrganism === ecoOrganism);
    const matching = candidates.find((candidate) => isEffectiveForDate(candidate, effectiveAt)) ?? candidates[0];

    if (!matching) {
      byOrganism[ecoOrganism] = defaultProfile;
      continue;
    }

    byOrganism[ecoOrganism] = {
      id: matching.id,
      ecoOrganism: toTariffEcoOrganism(matching.ecoOrganism),
      versionLabel: matching.versionLabel,
      effectiveFrom: matching.effectiveFrom.toISOString(),
      effectiveTo: matching.effectiveTo?.toISOString() ?? null,
      notes: matching.notes,
      isActive: matching.isActive,
      source: "database",
      updatedAt: matching.updatedAt.toISOString(),
      config: resolveTariffConfig(matching.rates, defaultProfile.config),
    };
  }

  return byOrganism;
}

export async function getActiveTariffProfileForDate(
  ecoOrganism: TariffEcoOrganism,
  effectiveAt = new Date(),
): Promise<TariffProfileSnapshot> {
  const profiles = await getActiveTariffProfilesMap(effectiveAt);
  return profiles[ecoOrganism] ?? createDefaultTariffProfile(ecoOrganism);
}
