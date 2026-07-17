"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_MEDIA_FOLDERS, deleteImage, isOwnedPublicId } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";

/**
 * Deletes an asset from the admin Media library only. Scoped to
 * `ADMIN_MEDIA_FOLDERS` (site imagery and the founder portrait) — a
 * user-owned review or profile photo is never reachable through this action,
 * because its public ID never lives in one of those folders.
 */
export async function deleteMediaAsset(publicId: string): Promise<void> {
  const session = await requireAdmin();

  const limit = checkRateLimit(`admin-media-delete:${session.user.id}`, {
    limit: 30,
    windowMs: 10 * 60_000,
  });
  if (!limit.success) {
    throw new Error("Too many deletions in a short time. Please try again shortly.");
  }

  if (!ADMIN_MEDIA_FOLDERS.some((folder) => isOwnedPublicId(publicId, folder))) {
    throw new Error("That image can't be deleted from here.");
  }

  await deleteImage(publicId);

  await logAdminAction({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "MEDIA_DELETED",
    targetType: "media",
    targetId: publicId,
  });

  revalidatePath("/admin/media");
}
