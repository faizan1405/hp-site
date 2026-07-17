import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/admin";
import {
  ADMIN_MEDIA_FOLDERS,
  CLOUDINARY_FOLDERS,
  ImageValidationError,
  assertMinAdminImageDimensions,
  isOwnedPublicId,
  replaceImage,
  uploadImage,
  type CloudinaryFolder,
} from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError, serverErrorResponse } from "@/lib/api-response";
import { logAdminAction } from "@/lib/audit";

export const runtime = "nodejs";

const FOLDER_BY_KEY: Record<string, CloudinaryFolder> = {
  site: CLOUDINARY_FOLDERS.site,
  founder: CLOUDINARY_FOLDERS.founder,
};

/**
 * Admin-only upload for the Media library (site imagery and the founder
 * portrait). Two modes, both authorized identically:
 *  - a plain upload (`folder`: "site" | "founder") mints a new asset;
 *  - a replace (`replacePublicId` set) overwrites an existing asset in
 *    place, so any page already linking to that URL keeps working.
 */
export async function POST(request: NextRequest) {
  let userId: string;
  let userEmail: string;
  try {
    const session = await requireAdmin();
    userId = session.user.id;
    userEmail = session.user.email ?? "";
  } catch (error) {
    if (error instanceof UnauthorizedError) return jsonError(error.message, 401);
    if (error instanceof ForbiddenError) return jsonError(error.message, 403);
    return serverErrorResponse(error);
  }

  const limit = checkRateLimit(`upload:site:${userId}`, { limit: 30, windowMs: 10 * 60_000 });
  if (!limit.success) {
    return jsonError("Too many uploads. Please try again shortly.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("No file was uploaded.", 400);
  }

  const replacePublicId = formData.get("replacePublicId");

  try {
    if (typeof replacePublicId === "string" && replacePublicId) {
      if (!ADMIN_MEDIA_FOLDERS.some((folder) => isOwnedPublicId(replacePublicId, folder))) {
        return jsonError("That image can't be replaced from here.", 400);
      }
      const uploaded = await replaceImage(file, replacePublicId);
      await assertMinAdminImageDimensions(uploaded);
      await logAdminAction({
        actorId: userId,
        actorEmail: userEmail,
        action: "MEDIA_REPLACED",
        targetType: "media",
        targetId: replacePublicId,
      });
      return NextResponse.json(uploaded, { status: 200 });
    }

    const folderKey = formData.get("folder");
    const folder = typeof folderKey === "string" ? FOLDER_BY_KEY[folderKey] : undefined;
    if (!folder) {
      return jsonError("Choose which folder to upload to.", 400);
    }

    const uploaded = await uploadImage(file, folder);
    await assertMinAdminImageDimensions(uploaded);
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    if (error instanceof ImageValidationError) return jsonError(error.message, 400);
    return serverErrorResponse(error);
  }
}
