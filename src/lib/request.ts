import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP from proxy headers. Vercel always sets these. */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first?.trim()) return first.trim();
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** ASCII control characters, excluding tab/newline/carriage-return. */
const CONTROL_CHARS_PATTERN = "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]";
const controlCharsRegExp = new RegExp(CONTROL_CHARS_PATTERN, "g");

/**
 * Strips control characters and trims to a max length before storage. This is
 * plain-text storage rendered as plain text (never `dangerouslySetInnerHTML`),
 * so no HTML escaping is needed — only defence against null bytes and stray
 * control characters padding out a field.
 */
export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(controlCharsRegExp, "").trim().slice(0, maxLength);
}
