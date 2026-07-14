"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contact, nav, product } from "@/config/content";

/**
 * The site's persistent top navigation. Fixed and semi-transparent so it sits
 * above the homepage's full-bleed scroll journey without ever entering its
 * timeline — GlacierExperience knows nothing about this component, and this
 * component knows nothing about GSAP.
 *
 * The phone link is icon-only below `sm` to keep the pill from crowding on a
 * phone screen (the device this number is mostly dialled from) and gains the
 * number itself once there is room for it.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 sm:px-6">
      <div className="flex w-full max-w-5xl items-center justify-between gap-2 rounded-full border border-white/15 bg-navy-900/60 px-4 py-2 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-2.5">
        <Link
          href="/"
          className="shrink-0 font-mono text-[0.6rem] tracking-[0.25em] text-silver uppercase transition-colors hover:text-ice sm:text-[0.65rem] sm:tracking-[0.3em]"
        >
          {product.descriptor}
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            {nav.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors sm:text-sm ${
                    isActive
                      ? "bg-white/10 text-ice"
                      : "text-silver hover:text-ice"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${contact.phone}`}
              className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-silver transition-colors hover:text-ice sm:h-auto sm:min-w-0 sm:border sm:border-white/15 sm:bg-white/5 sm:px-3 sm:py-1.5"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0"
              >
                <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
              </svg>
              <span className="hidden text-xs font-medium tracking-wide sm:inline">
                {contact.phone}
              </span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
