import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, UnauthorizedError, ForbiddenError } from "@/lib/admin";
import { ensureIndexes, reviewsCollection } from "@/lib/db/schema";
import { isOwnedPublicId, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/request";
import { reviewSchema } from "@/lib/validation";
import { jsonError, serverErrorResponse, zodErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let userId: string;
  let customerName: string;
  try {
    const session = await requireSession();
    userId = session.user.id;
    customerName = session.user.name ?? session.user.email ?? "Customer";
  } catch (error) {
    if (error instanceof UnauthorizedError) return jsonError(error.message, 401);
    if (error instanceof ForbiddenError) return jsonError(error.message, 403);
    return serverErrorResponse(error);
  }

  // A logged-in submitter is a stable, non-spoofable rate-limit key, and the
  // low limit doubles as the "prevent rapid spam" and "accidental duplicate
  // submission" requirement — a genuine second review has no reason to follow
  // the first within two minutes.
  const limit = checkRateLimit(`review:${userId}`, { limit: 1, windowMs: 2 * 60_000 });
  if (!limit.success) {
    return jsonError("Please wait a moment before submitting another review.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { rating, title, text, images } = parsed.data;

  // Every image must be one this app actually uploaded, into the reviews
  // folder — never trust a client-supplied Cloudinary public ID at face value.
  for (const image of images) {
    if (!isOwnedPublicId(image.publicId, CLOUDINARY_FOLDERS.review)) {
      return jsonError("One of the uploaded images is invalid.", 400);
    }
    if (!image.url.startsWith("https://res.cloudinary.com/")) {
      return jsonError("One of the uploaded images is invalid.", 400);
    }
  }

  try {
    await ensureIndexes();
    const reviews = await reviewsCollection();
    const now = new Date();

    const result = await reviews.insertOne({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      customerName: sanitizeText(customerName, 120),
      rating,
      title: title ? sanitizeText(title, 120) : null,
      text: sanitizeText(text, 3000),
      images,
      status: "PENDING",
      // No order backend exists yet — never claim a verified purchase.
      isVerifiedPurchase: false,
      adminNote: null,
      approvedAt: null,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
