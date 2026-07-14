import type { Metadata } from "next";
import { about, aboutWhatsappHref, contact, product, scenes } from "@/config/content";

export const metadata: Metadata = {
  title: about.heading,
  description: about.intro,
  alternates: { canonical: "/about" },
  openGraph: {
    title: about.heading,
    description: about.intro,
    url: "/about",
  },
};

const cardClass =
  "rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-7";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-navy-900">
      {/* Soft glacier-blue glow behind the hero, matching the rest of the site. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      {/* Hero. Top padding clears the fixed SiteNav pill. */}
      <section className="mx-auto max-w-3xl px-6 pt-28 pb-16 text-center sm:pt-36 sm:pb-20">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {about.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {about.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
          {about.intro}
        </p>
      </section>

      {/* Company introduction */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className={cardClass}>
          <p className="font-mono text-[0.65rem] tracking-[0.35em] text-glacier-300 uppercase">
            {product.descriptor}
          </p>
          <p className="mt-4 text-base leading-relaxed text-pretty text-silver md:text-lg">
            {scenes.device.intro.body}
          </p>
        </div>
      </section>

      {/* Contact information */}
      <section className="mx-auto max-w-3xl px-6 pb-28 sm:pb-32">
        <p className="text-center font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
          {about.contactHeading}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {contact.phone && (
            <div className={cardClass}>
              <p className="text-[0.7rem] tracking-[0.2em] text-silver-dim uppercase">
                Phone
              </p>
              <a
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className="mt-2 block text-lg text-ice transition-colors hover:text-glacier-300"
              >
                {contact.phone}
              </a>
            </div>
          )}

          {contact.email && (
            <div className={cardClass}>
              <p className="text-[0.7rem] tracking-[0.2em] text-silver-dim uppercase">
                Email
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-2 block text-lg break-all text-ice transition-colors hover:text-glacier-300"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact.address && (
            <div className={cardClass}>
              <p className="text-[0.7rem] tracking-[0.2em] text-silver-dim uppercase">
                Address
              </p>
              <address className="mt-2 text-base leading-relaxed text-pretty text-ice not-italic">
                {contact.address}
              </address>
            </div>
          )}

          {contact.hours && (
            <div className={cardClass}>
              <p className="text-[0.7rem] tracking-[0.2em] text-silver-dim uppercase">
                Business hours
              </p>
              <p className="mt-2 text-base text-ice">{contact.hours}</p>
            </div>
          )}
        </div>

        {aboutWhatsappHref && (
          <div className="mt-8 flex justify-center">
            <a
              href={aboutWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors duration-200 hover:bg-white"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.26 4.89L2 22l5.24-1.27a9.96 9.96 0 0 0 4.8 1.22h.01c5.52 0 10-4.48 10-10s-4.49-10-10.01-10Zm0 18.13h-.01a8.1 8.1 0 0 1-4.14-1.14l-.3-.17-3.1.75.83-3.02-.19-.31a8.13 8.13 0 0 1-1.25-4.24c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.1 8.1 0 0 1 2.39 5.78c0 4.51-3.67 8.12-8.17 8.12Zm4.48-6.11c-.24-.12-1.44-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34 1 2.5.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
