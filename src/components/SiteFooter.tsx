import { contact, siteName } from "@/config/content";

/**
 * The closing block of the page: full contact details, once and for all, in
 * plain document flow below the experience. Same null rule as FinalCTA — each
 * line renders only if the value behind it exists.
 */
export function SiteFooter() {
  const hasContact = Boolean(
    contact.email || contact.phone || contact.address || contact.hours,
  );
  if (!hasContact) return null;

  return (
    <footer className="border-t border-white/10 bg-navy-900 px-6 py-10 text-center text-xs leading-relaxed text-silver md:px-12 md:text-sm">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
        <p className="font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
          {siteName}
        </p>

        {contact.address && <p className="mt-2">{contact.address}</p>}

        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
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
        </div>

        {contact.hours && <p className="text-silver-dim">{contact.hours}</p>}
      </div>
    </footer>
  );
}
