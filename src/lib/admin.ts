import "server-only";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * Thrown by the route-handler / Server Action variants below so callers can
 * map them to the right HTTP status. Every admin mutation calls one of these
 * independently — a hidden button is not access control, so the check has to
 * live in the action itself, not just in whether the UI renders it.
 */
export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/** For Route Handlers and Server Actions — throws rather than redirecting. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("Sign in required.");
  if (!session.user.isActive) throw new ForbiddenError("This account has been deactivated.");
  return session;
}

/** For Route Handlers and Server Actions — throws rather than redirecting. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") throw new ForbiddenError("Admin access required.");
  return session;
}

/** For Server Component pages — redirects instead of throwing. */
export async function requireSessionForPage(callbackUrl: string): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (!session.user.isActive) {
    redirect("/signin?error=AccessDenied");
  }
  return session;
}

/**
 * For Server Component pages under `/admin` — redirects instead of throwing.
 * Deliberately does NOT delegate to `requireSessionForPage`: that helper
 * sends an unauthenticated visitor to the customer `/signin` page, but an
 * unauthenticated visitor to `/admin/*` should land on the dedicated
 * `/admin/login` page instead. A signed-in non-admin (an ordinary customer)
 * still goes to `/dashboard` — they don't need a login page, they need their
 * own account area.
 */
export async function requireAdminForPage(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login?callbackUrl=%2Fadmin");
  }
  if (!session.user.isActive) {
    redirect("/admin/login?error=AccessDenied");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}
