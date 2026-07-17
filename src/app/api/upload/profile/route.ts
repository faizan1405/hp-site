import { NextResponse, type NextRequest } from "next/server";
import { requireSession, UnauthorizedError, ForbiddenError } from "@/lib/admin";
import { CLOUDINARY_FOLDERS, ImageValidationError, uploadImage } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError, serverErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    const session = await requireSession();
    userId = session.user.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) return jsonError(error.message, 401);
    if (error instanceof ForbiddenError) return jsonError(error.message, 403);
    return serverErrorResponse(error);
  }

  const limit = checkRateLimit(`upload:profile:${userId}`, { limit: 10, windowMs: 10 * 60_000 });
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

  try {
    const uploaded = await uploadImage(file, CLOUDINARY_FOLDERS.profile);
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    if (error instanceof ImageValidationError) return jsonError(error.message, 400);
    return serverErrorResponse(error);
  }
}
