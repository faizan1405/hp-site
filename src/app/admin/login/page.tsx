import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  AccessDenied: "This account has been deactivated.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role === "ADMIN" && session.user.isActive) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const errorMessage = error ? (errorMessages[error] ?? null) : null;

  return (
    <main
      style={{ colorScheme: "light" }}
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-24"
    >
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">Himalaya Sparsh</p>
          <p className="mt-1 text-xs tracking-wide text-gray-500 uppercase">Admin Login</p>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-6">
          <AdminLoginForm />
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to the website
        </Link>
      </div>
    </main>
  );
}
