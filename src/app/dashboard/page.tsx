import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { buyNowWhatsappHref, dashboard, pageSeo } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.dashboard.title,
  description: pageSeo.dashboard.description,
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: pageSeo.dashboard.title,
    description: pageSeo.dashboard.description,
    url: "/dashboard",
  },
  // A logged-out account shell should not be indexed as content.
  robots: { index: false, follow: true },
};

/**
 * The customer dashboard. This project has NO authentication or account backend,
 * so nothing here is live data and nothing pretends to be — the page is an
 * honest preview of the account area, with a clear notice explaining that
 * sign-in requires backend work that does not yet exist. The two things that DO
 * work today — WhatsApp support and the contact shortcut — are real links.
 *
 * When accounts are built, replace this static preview with the authenticated
 * views; the feature list in `content.ts` already names each panel.
 */
export default function DashboardPage() {
  return (
    <main className="relative min-h-screen bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-4xl px-6 pt-28 pb-8 sm:pt-36">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {dashboard.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {dashboard.heading}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
          {dashboard.intro}
        </p>
      </section>

      {/* Honest notice — no faked login, no faked data. */}
      <section className="mx-auto max-w-4xl px-6 pb-10">
        <div className="flex items-start gap-3 rounded-2xl border border-glacier-500/25 bg-glacier-500/5 p-5">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mt-0.5 h-5 w-5 shrink-0 text-glacier-300"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
          </svg>
          <p className="text-sm leading-relaxed text-pretty text-silver">
            {dashboard.notice}
          </p>
        </div>
      </section>

      {/* Preview of the account panels. Clearly labelled, not populated. */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboard.features.map((feature) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-white/10 bg-navy-900/50 p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl leading-tight font-light text-ice">
                  {feature.title}
                </h2>
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[0.6rem] tracking-[0.15em] text-silver-dim uppercase">
                  Sign-in required
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The parts that genuinely work today. */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <p className="font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
          Available now
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={buyNowWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-[#22c15e]"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            WhatsApp support
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10"
          >
            Contact us
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
