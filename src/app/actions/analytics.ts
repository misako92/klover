"use server";

import { unstable_cache } from "next/cache";

import { requireOrgContext } from "@/lib/auth/context";
import { getActiveTariffProfilesMap } from "@/lib/compliance/tariff-profiles";
import prisma from "@/lib/db";
import { simulateContribution } from "@/services/contribution";

export async function getDashboardStats() {
  const { orgId } = await requireOrgContext();

  const cached = unstable_cache(
    async () => {
      const products = await prisma.product.findMany({
        where: {
          orgId,
          status: { not: "ARCHIVED" },
        },
        select: {
          quantitySold: true,
          weightG: true,
          materialType: true,
          ecoOrganism: true,
          packagingType: true,
          isReusable: true,
          reuseCount: true,
          status: true,
        },
      });

      const tariffProfiles = await getActiveTariffProfilesMap();
      const { totalCents, totalWeightG, breakdown } = simulateContribution(products, { tariffProfiles });
      const totalProducts = products.length;
      // biome-ignore lint/suspicious/noExplicitAny: prisma generic filter
      const classifiedCount = products.filter((p: any) => p.status === "CONFIRMED").length;
      const classificationRate = totalProducts > 0 ? (classifiedCount / totalProducts) * 100 : 0;

      return {
        totalTonnage: totalWeightG / 1000000,
        classificationRate,
        estimatedFees: totalCents / 100,
        breakdownByMaterial: Object.entries(breakdown.byMaterial).map(([k, v]) => ({
          name: k.replace("_", " "),
          value: v / 100,
        })),
        breakdownByOrganism: Object.entries(breakdown.byOrganism).map(([k, v]) => ({
          name: k,
          value: v / 100,
        })),
      };
    },
    ["dashboard-stats", orgId],
    { revalidate: 60, tags: [`dashboard-stats:${orgId}`] },
  );

  return await cached();
}
