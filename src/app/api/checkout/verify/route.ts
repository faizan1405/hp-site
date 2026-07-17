import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, UnauthorizedError, ForbiddenError } from "@/lib/admin";
import { ordersCollection } from "@/lib/db/schema";
import { verifyPaymentSchema } from "@/lib/validation";
import { jsonError, serverErrorResponse, zodErrorResponse } from "@/lib/api-response";
import { verifyRazorpaySignature } from "@/lib/razorpay";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = parsed.data;

  try {
    const orders = await ordersCollection();
    // Ownership check: only the customer who opened this order can confirm
    // it, and only a still-pending order can be marked paid — never let a
    // resubmitted or replayed request flip an already-settled order back.
    const order = await orders.findOne({
      razorpayOrderId,
      userId: new ObjectId(userId),
    });

    if (!order) {
      return jsonError("Order not found.", 404);
    }
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ success: order.status === "PAID", orderNumber: order.orderNumber });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      await orders.updateOne(
        { _id: order._id },
        { $set: { status: "PAYMENT_FAILED", updatedAt: new Date() } },
      );
      return jsonError("Payment verification failed.", 400);
    }

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          status: "PAID",
          razorpayPaymentId,
          razorpaySignature,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
