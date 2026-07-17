import "server-only";
import { ObjectId } from "mongodb";
import { auditLogsCollection, type AuditAction } from "@/lib/db/schema";

/**
 * Best-effort audit trail for sensitive admin actions. Called AFTER the
 * action it describes has already succeeded — a logging failure must never
 * turn a successful moderation/role-change/deletion into an error for the
 * admin who just performed it.
 */
export async function logAdminAction(entry: {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: "review" | "user" | "enquiry" | "media" | "settings";
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const logs = await auditLogsCollection();
    await logs.insertOne({
      _id: new ObjectId(),
      actorId: new ObjectId(entry.actorId),
      actorEmail: entry.actorEmail,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      meta: entry.meta ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
