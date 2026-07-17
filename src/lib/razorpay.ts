import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "@/lib/env";

type GlobalWithRazorpay = typeof globalThis & { __razorpayClient?: Razorpay };

/** Memoized on `globalThis` like the Mongo client — one instance per warm process. */
export function getRazorpayClient(): Razorpay {
  const globalWithClient = globalThis as GlobalWithRazorpay;
  if (!globalWithClient.__razorpayClient) {
    globalWithClient.__razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return globalWithClient.__razorpayClient;
}

/**
 * Razorpay's own recipe: HMAC-SHA256 of `"{order_id}|{payment_id}"`, keyed by
 * the key secret, must equal the signature the client reports back. This is
 * the only thing that actually proves the payment happened — everything else
 * in the success callback is client-reported and unverified.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
