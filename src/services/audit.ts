"use server";

import prisma from "@/lib/db";

const isDev = process.env.NODE_ENV !== "production";
const _mockEnabled = (process.env.MOCK_MODE ?? (isDev ? "true" : "false")) === "true";

export interface AuditEvent {
  orgId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an audit event to the database.
 * In mock mode, logs to console instead.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  // Real implementation - no mock check
  // if (mockEnabled) { ... }

  try {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic prisma model
    await (prisma as any).auditLog.create({
      data: {
        orgId: event.orgId,
        userId: event.userId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        details: event.details ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[AUDIT ERROR]", error);
  }
}

/**
 * Retrieves audit logs for an organization, ordered by most recent first.
 */
export async function getAuditLogs(orgId: string, options?: { limit?: number; entityType?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic prisma model
  return (prisma as any).auditLog.findMany({
    where: {
      orgId,
      ...(options?.entityType ? { entityType: options.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });
}
