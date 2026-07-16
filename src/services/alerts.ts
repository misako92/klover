"use server";

import prisma from "@/lib/db";

const isDev = process.env.NODE_ENV !== "production";
const _mockEnabled = (process.env.MOCK_MODE ?? (isDev ? "true" : "false")) === "true";

interface AlertInput {
  orgId: string;
  type: string;
  title: string;
  message: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  entityType?: string;
  entityId?: string;
}

/**
 * Creates an alert for an organization.
 */
export async function createAlert(input: AlertInput): Promise<void> {
  try {
    // biome-ignore lint/suspicious/noExplicitAny: prisma bypass
    await (prisma as any).alert.create({
      data: {
        orgId: input.orgId,
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity || "INFO",
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  } catch (error) {
    console.error("[ALERT ERROR]", error);
  }
}

/**
 * Gets alerts for an organization.
 */
export async function getAlerts(orgId: string, options?: { unreadOnly?: boolean; limit?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: prisma bypass
  const where: any = { orgId };
  if (options?.unreadOnly) {
    where.isRead = false;
  }

  // biome-ignore lint/suspicious/noExplicitAny: prisma bypass
  return (prisma as any).alert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 20,
  });
}

/**
 * Marks an alert as read.
 */
export async function markAlertRead(alertId: string): Promise<void> {
  try {
    // biome-ignore lint/suspicious/noExplicitAny: prisma bypass
    await (prisma as any).alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("[ALERT READ ERROR]", error);
  }
}

/**
 * Auto-generates alerts based on current data state.
 * Called after imports, classifications, or periodically.
 */
export async function generateSystemAlerts(orgId: string): Promise<void> {
  try {
    // Check for unclassified products
    const unclassifiedCount = await prisma.product.count({
      where: { orgId, status: "NEEDS_REVIEW" },
    });

    if (unclassifiedCount > 0) {
      // Check if a similar active alert already exists
      // biome-ignore lint/suspicious/noExplicitAny: prisma bypass
      const existing = await (prisma as any).alert.findFirst({
        where: { orgId, type: "UNCLASSIFIED_PRODUCTS", isRead: false },
      });

      if (!existing) {
        await createAlert({
          orgId,
          type: "UNCLASSIFIED_PRODUCTS",
          title: `${unclassifiedCount} produit${unclassifiedCount > 1 ? "s" : ""} à classifier`,
          message: "Des produits importés nécessitent une classification pour calculer leurs éco-contributions.",
          severity: "WARNING",
          entityType: "Product",
        });
      }
    }
  } catch (error) {
    console.error("[ALERT GENERATION ERROR]", error);
  }
}
