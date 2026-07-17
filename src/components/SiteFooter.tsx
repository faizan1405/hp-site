import Link from "next/link";
import { contact, nav, siteName } from "@/config/content";

/**
 * The closing block of the page: internal navigation and full contact details,
 * once and for all, in plain document flow below the experience. Same null rule
 * as FinalCTA — each contact line renders only if the value behind it exists.
 * The nav links are always present, so they help both wayfinding and SEO on
 * every page that mounts the footer.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-900 px-6 py-12 text-center text-xs leading-relaxed text-silver md:px-12 md:text-sm">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <p className="font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
          {siteName}
        </p>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-silver transition-colors hover:text-ice"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {contact.address && <p className="mt-1">{contact.address}</p>}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              className="transition-colors hover:text-ice"
            >
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="transition-colors hover:text-ice"
            >
              {contact.email}
            </a>
          )}
          {contact.hours && <span className="text-silver-dim">{contact.hours}</span>}
        </div>
      </div>
    </footer>
  );
}
