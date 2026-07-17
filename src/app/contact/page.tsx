import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageBackground } from "@/components/PageBackground";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { contact, contactPage, pageBackgrounds, pageSeo } from "@/config/content";

export const metadata: Metadata = {
  title: pageSeo.contact.title,
  description: pageSeo.contact.description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: pageSeo.contact.title,
    description: pageSeo.contact.description,
    url: "/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: pageSeo.contact.title,
    description: pageSeo.contact.description,
  },
};

const cardClass = "rounded-2xl border border-white/15 bg-navy-900/70 p-6";
const cardLabelClass =
  "text-[0.7rem] tracking-[0.2em] text-silver-dim uppercase";

const telHref = contact.phone
  ? `tel:${contact.phone.replace(/[^\d+]/g, "")}`
  : null;

/**
 * Structured data for the organisation's contact details. Only fields that are
 * actually confirmed are emitted — no invented ratings, no unproven claims.
 */
const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Himalaya Sparsh",
  ...(contact.email ? { email: contact.email } : {}),
  ...(contact.phone ? { telephone: `+91${contact.phone}` } : {}),
  ...(contact.address
    ? { address: { "@type": "PostalAddress", streetAddress: contact.address } }
    : {}),
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-navy-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      <PageBackground src={pageBackgrounds.contact} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(111,191,230,0.16)_0%,rgba(111,191,230,0.05)_45%,transparent_75%)]"
      />

      <section className="mx-auto max-w-3xl px-6 pt-28 pb-12 text-center sm:pt-36">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {contactPage.eyebrow}
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
          {contactPage.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
          {contactPage.intro}
        </p>
      </section>

      {/* Contact details — every one clickable. */}
      <section className="mx-auto max-w-4xl px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {telHref && (
            <div className={cardClass}>
              <p className={cardLabelClass}>Phone</p>
              <a
                href={telHref}
                className="mt-2 block text-lg text-ice transition-colors hover:text-glacier-300"
              >
                {contact.phone}
              </a>
            </div>
          )}

          <div className={cardClass}>
            <p className={cardLabelClass}>WhatsApp</p>
            <a
              href={contactPage.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-lg text-ice transition-colors hover:text-glacier-300"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              Message us
            </a>
          </div>

          {contact.email && (
            <div className={cardClass}>
              <p className={cardLabelClass}>Email</p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-2 block text-lg break-all text-ice transition-colors hover:text-glacier-300"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact.hours && (
            <div className={cardClass}>
              <p className={cardLabelClass}>Business hours</p>
              <p className="mt-2 text-lg text-ice">{contact.hours}</p>
            </div>
          )}

          {contact.address && (
            <div className={`${cardClass} sm:col-span-2`}>
              <p className={cardLabelClass}>Address</p>
              <address className="mt-2 text-base leading-relaxed text-pretty text-ice not-italic">
                {contact.address}
              </address>
              {contactPage.mapHref && (
                <a
                  href={contactPage.mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-glacier-300 underline decoration-glacier-500/40 underline-offset-2 transition-colors hover:text-ice"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                  Open in Google Maps
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* The form. */}
      <section className="mx-auto max-w-2xl px-6 pt-10 pb-24">
        <div className="rounded-2xl border border-white/15 bg-navy-900/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl leading-tight font-light text-ice md:text-3xl">
            {contactPage.formHeading}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
            {contactPage.formIntro}
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
