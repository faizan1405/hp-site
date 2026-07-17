"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";

/**
 * Keeps the public `SiteNav` off every `/admin` route (its own header lives
 * in `AdminLayout`) without touching `SiteNav` itself — another agent owns
 * that component. `usePathname` is resolved from the router context on the
 * server-rendered pass too, so there's no post-hydration flash the way a
 * `useSession`-driven check would have.
 */
export function PublicSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdminRoute && <SiteNav />}
      {children}
    </>
  );
}
