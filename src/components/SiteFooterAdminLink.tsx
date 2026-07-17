"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * A deliberately unobtrusive footer link — small, muted, last in the footer's
 * flow. Session-aware so it never shows the wrong thing: a logged-out visitor
 * sees "Admin Login", a signed-in admin sees "Admin Panel", and a signed-in
 * ordinary customer sees nothing at all. Client-only because `useSession`
 * resolves from a client fetch after hydration, same reasoning as the
 * sign-in/sign-out control in SiteNav — this keeps every static page the
 * footer sits on from having to opt into dynamic rendering just for this.
 */
export function SiteFooterAdminLink() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (session?.user && session.user.role !== "ADMIN") return null;

  const isAdmin = Boolean(session?.user && session.user.role === "ADMIN");

  return (
    <Link
      href={isAdmin ? "/admin" : "/admin/login"}
      className="text-[0.65rem] text-silver-dim/70 transition-colors hover:text-silver"
    >
      {isAdmin ? "Admin Panel" : "Admin Login"}
    </Link>
  );
}
