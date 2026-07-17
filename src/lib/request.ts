import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP from proxy headers. Vercel always sets these. Takes
 * a header lookup function rather than a `Headers` object so it works both
 * from `next/headers()` (Server Components, Route Handlers, Server Actions)
 * and from a raw Fetch API `Request` (Auth.js's `authorize()` callback,
 * which does not run inside `next/headers`'s request-scoped context). */
export function extractClientIp(getHeader: (name: string) => string | null): string {
  const forwardedFor = getHeader("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first?.trim()) return first.trim();
  }
  const realIp = getHeader("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return extractClientIp((name) => headersList.get(name));
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
