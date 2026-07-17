import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, UnauthorizedError, ForbiddenError } from "@/lib/admin";
import { ensureIndexes, ordersCollection } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/request";
import { checkoutSchema } from "@/lib/validation";
import { jsonError, serverErrorResponse, zodErrorResponse } from "@/lib/api-response";
import { env, isRazorpayConfigured } from "@/lib/env";
import { getRazorpayClient } from "@/lib/razorpay";
import { commerce, product } from "@/config/content";

export const runtime = "nodejs";

function generateOrderNumber(): string {
  return `HS${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

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

  if (!isRazorpayConfigured() || !commerce.amountInPaise) {
    return jsonError("Online payment isn't available yet. Please enquire on WhatsApp instead.", 503);
  }

  // A signed-in customer is a stable rate-limit key; this only needs to stop
  // a runaway client from opening many Razorpay orders back to back.
  const limit = checkRateLimit(`checkout:${userId}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limit.success) {
    return jsonError("Please wait a moment before trying again.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { name, email, phone, address, city, state, postalCode } = parsed.data;

  try {
    await ensureIndexes();
    const razorpay = getRazorpayClient();
    const orderNumber = generateOrderNumber();

    const razorpayOrder = await razorpay.orders.create({
      amount: commerce.amountInPaise,
      currency: commerce.currency,
      receipt: orderNumber,
      notes: { orderNumber, userId },
    });

    const orders = await ordersCollection();
    const now = new Date();

    await orders.insertOne({
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      orderNumber,
      productName: product.name,
      amount: commerce.amountInPaise,
      currency: commerce.currency,
      status: "PENDING_PAYMENT",
      customerName: sanitizeText(name, 120),
      email: sanitizeText(email, 200),
      phone: sanitizeText(phone, 20),
      address: sanitizeText(address, 300),
      city: sanitizeText(city, 100),
      state: sanitizeText(state, 100),
      postalCode: sanitizeText(postalCode, 20),
      razorpayOrderId: razorpayOrder.id,
      razorpayPaymentId: null,
      razorpaySignature: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      amount: commerce.amountInPaise,
      currency: commerce.currency,
      productName: product.name,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      orderNumber,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
