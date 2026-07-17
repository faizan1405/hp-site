import "server-only";
import { env, isEmailConfigured } from "@/lib/env";

/**
 * Optional Resend notification for a new contact enquiry. Plain `fetch`
 * against Resend's REST API rather than the `resend` SDK, so nothing extra
 * needs installing for a feature that stays off until three env vars are set.
 *
 * Never throws — the enquiry is already persisted in MongoDB by the time
 * this runs, and a notification failure must not turn a successful
 * submission into an error response for the visitor.
 */
export async function sendContactNotification(params: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ sent: boolean }> {
  if (!isEmailConfigured()) return { sent: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: env.CONTACT_RECEIVER_EMAIL,
        reply_to: params.email,
        subject: params.subject
          ? `New enquiry: ${params.subject}`
          : `New enquiry from ${params.name}`,
        text: [
          `Name: ${params.name}`,
          `Email: ${params.email}`,
          `Phone: ${params.phone ?? "—"}`,
          "",
          params.message,
        ].join("\n"),
      }),
    });
    return { sent: response.ok };
  } catch (error) {
    console.error("Contact notification email failed:", error);
    return { sent: false };
  }
}
