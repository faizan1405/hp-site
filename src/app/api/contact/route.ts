import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { contactEnquiriesCollection, ensureIndexes } from "@/lib/db/schema";
import { sendContactNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, sanitizeText } from "@/lib/request";
import { contactSchema } from "@/lib/validation";
import { jsonError, serverErrorResponse, zodErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  const limit = checkRateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limit.success) {
    return jsonError("Too many messages sent. Please try again shortly.", 429, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { name, email, phone, subject, message, company } = parsed.data;

  // Honeypot: a human never fills this hidden field. Reply as if it worked —
  // telling a bot it was detected only teaches it to adapt.
  if (company) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    await ensureIndexes();
    const session = await auth();
    const enquiries = await contactEnquiriesCollection();
    const now = new Date();

    await enquiries.insertOne({
      _id: new ObjectId(),
      name: sanitizeText(name, 120),
      email: sanitizeText(email, 200),
      phone: phone ? sanitizeText(phone, 20) : null,
      subject: subject ? sanitizeText(subject, 150) : null,
      message: sanitizeText(message, 4000),
      status: "NEW",
      adminNote: null,
      userId: session?.user ? new ObjectId(session.user.id) : null,
      source: "website",
      createdAt: now,
      updatedAt: now,
    });

    const { sent } = await sendContactNotification({ name, email, phone, subject, message });

    return NextResponse.json({ success: true, emailSent: sent }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
