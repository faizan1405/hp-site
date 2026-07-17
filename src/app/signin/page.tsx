import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SiteFooter } from "@/components/SiteFooter";
import { siteName } from "@/config/content";

export const metadata: Metadata = {
  title: "Sign in",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: true },
};

const errorMessages: Record<string, string> = {
  AccessDenied:
    "This account has been deactivated. Contact us if you think that's a mistake.",
  OAuthAccountNotLinked:
    "That email is already associated with a different sign-in method.",
  Default: "Something went wrong while signing in. Please try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  const destination =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  if (session?.user) {
    redirect(destination);
  }

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <main className="relative flex min-h-screen flex-col bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pt-28 pb-24 sm:pt-32">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          Sign in
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl">
          Welcome to {siteName}
        </h1>
        <p className="mt-5 text-justify [text-align-last:left] text-base leading-relaxed break-words text-pretty text-silver">
          Sign in with Google to manage your profile, track enquiries and see
          the status of reviews you&apos;ve submitted.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-justify [text-align-last:left] text-sm leading-relaxed break-words text-pretty text-red-200"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <GoogleSignInButton callbackUrl={destination} />
          <p className="mt-4 text-center text-xs leading-relaxed text-silver-dim">
            We only use your Google account to create your profile — name,
            email and profile photo.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 text-center text-sm text-silver transition-colors hover:text-ice"
        >
          ← Back to the homepage
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
