import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/SiteFooter";
import { founder, leadership, pageSeo } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.leadership.title,
  description: pageSeo.leadership.description,
  alternates: { canonical: "/leadership" },
  openGraph: {
    title: pageSeo.leadership.title,
    description: pageSeo.leadership.description,
    url: "/leadership",
  },
  twitter: {
    card: "summary_large_image",
    title: pageSeo.leadership.title,
    description: pageSeo.leadership.description,
  },
};

/** Initials for the portrait placeholder, e.g. "Arveen Maan" → "AM". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function LeadershipPage() {
  return (
    <main className="relative min-h-screen bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-3xl px-6 pt-28 pb-16 sm:pt-36">
        <div className="text-center">
          <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
            {leadership.eyebrow}
          </p>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
            {leadership.heading}
          </h1>
        </div>

        {/* Founder portrait area. A real image drops in via `founder.image`;
            until then, an elegant monogram medallion stands in for it. */}
        <figure className="mt-12 flex flex-col items-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border border-white/15 sm:h-36 sm:w-36">
            {founder.image ? (
              <Image
                src={founder.image}
                alt={
                  founder.name
                    ? `${founder.name}, ${founder.role ?? "Founder"} of Himalaya Sparsh`
                    : "Founder of Himalaya Sparsh"
                }
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgba(159,212,240,0.85),rgba(20,50,75,0.9)_75%)] font-display text-4xl font-light text-navy-900"
              >
                {founder.name ? initials(founder.name) : "HS"}
              </div>
            )}
          </div>
          {founder.name && (
            <figcaption className="mt-5 text-center">
              <p className="font-display text-xl font-light text-ice">
                {founder.name}
              </p>
              {founder.role && (
                <p className="mt-1 text-sm tracking-wide text-silver">
                  {founder.role}
                </p>
              )}
            </figcaption>
          )}
        </figure>

        {/* The note itself. */}
        <div className="mt-14 flex flex-col gap-5">
          {founder.story?.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "font-display text-2xl leading-snug font-light text-balance text-ice md:text-3xl"
                  : "text-base leading-relaxed text-pretty text-silver md:text-lg"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Signature block. */}
        {founder.name && (
          <div className="mt-12 border-t border-white/10 pt-8">
            <p className="font-display text-xl font-light text-ice">
              {founder.name}
            </p>
            {founder.role && (
              <p className="mt-1 text-sm tracking-wide text-silver">
                {founder.role}
              </p>
            )}
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
              Himalaya Sparsh™
            </p>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
