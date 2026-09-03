import { auditLog } from '../schema/ops.js';
import type { Database } from '../client.js';

export interface AuditEntryInput {
  actorUserId?: string | null;
  actorApiKeyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
}

/**
 * Append-only audit logger.
 * Required on every state mutation (booking created, cancelled, price override, settings changed).
 */
export async function recordAuditLog(db: Database, input: AuditEntryInput): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: input.actorUserId ?? null,
    actorApiKeyId: input.actorApiKeyId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    reason: input.reason ?? null,
    ip: input.ip ?? null,
  });
}
