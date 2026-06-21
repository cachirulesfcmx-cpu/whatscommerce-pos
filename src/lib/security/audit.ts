import { prisma } from "@/lib/prisma";

export interface AuditInput {
  storeId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/** Fire-and-forget audit log (never throws into the request path). */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        storeId: input.storeId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? {}) as object,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch {
    /* swallow */
  }
}
