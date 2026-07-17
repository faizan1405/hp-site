import type { Metadata } from "next";
import Link from "next/link";
import { PageBackground } from "@/components/PageBackground";
import { SiteFooter } from "@/components/SiteFooter";
import {
  about,
  deviceLayers,
  fruitComparison,
  ingredientBenefits,
  pageBackgrounds,
  pageSeo,
} from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.about.title,
  description: pageSeo.about.description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: pageSeo.about.title,
    description: pageSeo.about.description,
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: pageSeo.about.title,
    description: pageSeo.about.description,
  },
};

const cardClass = "rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-7";
const eyebrowClass =
  "font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase";

export default function AboutPage() {
  return (
    <main className="relative isolate min-h-screen bg-navy-900">
      {/* Focal peak sits right-of-centre in the source photo; keep it in
          frame without letting it crowd the long story paragraphs. */}
      <PageBackground
        src={pageBackgrounds.about}
        objectPosition="object-[68%_50%] sm:object-[58%_50%] lg:object-[50%_42%]"
      />

      {/* Soft glacier-blue glow behind the hero, matching the rest of the site. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <div className="relative z-10">
      {/* Hero. Top padding clears the fixed SiteNav pill. */}
      <section className="mx-auto max-w-3xl px-6 pt-28 pb-14 text-center sm:pt-36">
        <p className={eyebrowClass}>{about.eyebrow}</p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {about.heading}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-glacier-300 md:text-xl">
          {about.subheading}
        </p>
      </section>

      {/* Brand story — the client's own copy, paragraph by paragraph. */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="flex flex-col gap-5">
          {about.body.map((paragraph, index) => (
            <p
              key={index}
              className="text-justify [text-align-last:left] text-base leading-relaxed break-words text-pretty text-silver hyphens-auto md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Closing sign-off. */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="font-display text-2xl font-light text-ice md:text-3xl">
            {about.closing.name}
          </p>
          <p className="mt-3 text-sm tracking-wide text-silver md:text-base">
            {about.closing.descriptor}
          </p>
          <p className="mt-2 font-display text-lg text-glacier-300 md:text-xl">
            {about.closing.tagline}
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- *
          A. INGREDIENTS — the nine confirmed device media, in journey order.
          Reuses `deviceLayers`, the single source of truth also driving the
          homepage walk, so the two can never disagree.
          -------------------------------------------------------------- */}
      <section
        id="ingredients"
        className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16 md:py-20"
      >
        <p className={eyebrowClass}>{about.ingredientsHeading}</p>
        <h2 className="mt-4 font-display text-3xl leading-tight font-light text-balance text-ice md:text-4xl">
          Inside the device
        </h2>
        <p className="mt-5 max-w-2xl text-justify [text-align-last:left] text-base leading-relaxed break-words text-pretty text-silver hyphens-auto md:text-lg">
          {about.ingredientsIntro}
        </p>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2">
          {deviceLayers.map((layer, index) => (
            <li key={layer.id} className={cardClass}>
              <div className="flex items-start gap-4">
                {/* Premium visual: a glacier-gradient step medallion. No
                    per-ingredient photography exists, so this stands in for it
                    rather than a stock image that could imply a false source. */}
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(159,212,240,0.9),rgba(61,148,196,0.35)_70%,rgba(6,19,33,0)_100%)] font-display text-lg text-navy-900"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] text-glacier-500/80 uppercase">
                    Step {index + 1} of {deviceLayers.length}
                  </p>
                  <h3 className="mt-1 font-display text-2xl leading-tight font-light text-ice">
                    {layer.name}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-justify [text-align-last:left] text-sm leading-relaxed break-words text-pretty text-silver hyphens-auto">
                {layer.description}
              </p>
              {layer.verifiedFunction && (
                <p className="mt-2 text-justify [text-align-last:left] text-sm leading-relaxed break-words text-pretty text-ice hyphens-auto">
                  {layer.verifiedFunction}
                </p>
              )}
              {layer.sourceNote && (
                <p className="mt-3 text-[0.7rem] leading-relaxed text-silver-dim">
                  {layer.sourceNote}
                  {layer.verificationStatus && <> · {layer.verificationStatus}</>}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------------- *
          B. BENEFITS OF INGREDIENTS — responsibly worded, no medical claims.
          -------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <p className={eyebrowClass}>{ingredientBenefits.heading}</p>
        <p className="mt-5 max-w-2xl text-justify [text-align-last:left] text-base leading-relaxed break-words text-pretty text-silver hyphens-auto md:text-lg">
          {ingredientBenefits.intro}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ingredientBenefits.items.map((item) => (
            <div key={item.id} className={cardClass}>
              <h3 className="font-display text-xl leading-tight font-light text-ice">
                {item.title}
              </h3>
              <p className="mt-3 text-justify [text-align-last:left] text-sm leading-relaxed break-words text-pretty text-silver hyphens-auto">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 rounded-2xl border border-glacier-500/20 bg-glacier-500/5 p-5 text-justify [text-align-last:left] text-[0.8rem] leading-relaxed break-words text-pretty text-silver-dim hyphens-auto">
          {ingredientBenefits.disclaimer}
        </p>
      </section>

      {/* -------------------------------------------------------------- *
          C. FRUIT & FOOD COMPARISON — educational only, sourced from official
          nutrition databases, clearly labelled as not a claim about the water.
          -------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <p className={eyebrowClass}>{fruitComparison.heading}</p>
        <p className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm leading-relaxed text-pretty text-ice">
          {fruitComparison.label}
        </p>
        <p className="mt-6 max-w-2xl text-justify [text-align-last:left] text-base leading-relaxed break-words text-pretty text-silver hyphens-auto md:text-lg">
          {fruitComparison.intro}
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-3 pr-4 font-mono text-[0.65rem] tracking-[0.2em] text-glacier-300 uppercase">
                  Mineral
                </th>
                <th className="py-3 font-mono text-[0.65rem] tracking-[0.2em] text-glacier-300 uppercase">
                  Where it occurs naturally in food
                </th>
              </tr>
            </thead>
            <tbody>
              {fruitComparison.rows.map((row) => (
                <tr key={row.mineral} className="border-b border-white/10 align-top">
                  <th
                    scope="row"
                    className="py-4 pr-4 font-display text-lg font-light whitespace-nowrap text-ice"
                  >
                    {row.mineral}
                  </th>
                  <td className="py-4 leading-relaxed text-pretty text-silver">
                    {row.foods}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-justify [text-align-last:left] text-[0.8rem] leading-relaxed break-words text-pretty text-silver-dim hyphens-auto">
          {fruitComparison.note}
        </p>

        <div className="mt-6">
          <p className="font-mono text-[0.65rem] tracking-[0.25em] text-silver-dim uppercase">
            Sources
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {fruitComparison.sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-glacier-300 underline decoration-glacier-500/40 underline-offset-2 transition-colors hover:text-ice"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Wayfinding to the two most likely next steps. */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/leadership"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-medium tracking-wide text-ice transition-colors hover:bg-white/10"
          >
            A note from the founder
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors hover:bg-white"
          >
            Contact us
          </Link>
        </div>
      </section>

      <SiteFooter />
      </div>
    </main>
  );
}
