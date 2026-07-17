import type { Metadata } from "next";
import { requireAdminForPage } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The admin panel's own shell — intentionally a separate visual system from
 * the public site's cinematic scroll experience: light background, plain
 * borders, no gradients or scroll animation. `color-scheme: light` is set
 * explicitly because the root layout fixes the whole document to a dark
 * native color scheme for the public pages; without this override, native
 * form controls (date pickers, the confirm dialog's backdrop) would render
 * with dark-mode chrome against a light admin UI.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminForPage();

  return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 text-gray-900 lg:flex">
      <AdminSidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        }}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
