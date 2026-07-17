"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { contact, nav, product } from "@/config/content";

/** Small phone glyph shared by the persistent call button and the mobile-menu entry. */
function PhoneIcon({ className = "h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
    </svg>
  );
}

/**
 * The site's persistent top navigation. Fixed and semi-transparent so it sits
 * above the homepage's full-bleed scroll journey without ever entering its
 * timeline — GlacierExperience knows nothing about this component, and this
 * component knows nothing about GSAP.
 *
 * Three fixed-width regions (brand / inline links / account actions) share one
 * row via `justify-between`, so the middle region is the only one that ever
 * carries the six-link list. That list — and the account controls — collapse
 * into an accessible toggle below `xl`, the first breakpoint with enough room
 * for all six labels plus the call button and the auth control without any of
 * them wrapping or spilling past the rounded pill. The toggle opens a panel
 * that closes on Escape, on outside click, on navigation and automatically if
 * the viewport grows past `xl` while it's open.
 *
 * The phone number itself is never rendered as text here — only a labelled
 * "Call Us" `tel:` link, so nothing in the pill grows or shrinks by breakpoint
 * the way a raw ten-digit number would.
 */
export function SiteNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // "How It Works" is the homepage, so it is active on "/"; every other item is
  // active on an exact path match.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Escape closes and returns focus to the toggle; an outside click closes.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // If the viewport grows past the inline-nav breakpoint while the panel is
  // open, close it — otherwise it would sit open behind the desktop layout.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  const phoneHref = contact.phone
    ? `tel:${contact.phone.replace(/[^\d+]/g, "")}`
    : null;

  // Session-aware sign-in / sign-out control. `useSession` resolves from a
  // client fetch after hydration rather than a server auth check, so the nav
  // — and every static page it sits on — never has to opt into dynamic
  // rendering just to know who's signed in. The `min-w` holds the slot's
  // width steady across loading → signed-in / signed-out so resolving the
  // session never shifts the rest of the pill.
  const authControl =
    status === "loading" ? (
      <span
        aria-hidden="true"
        className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10"
      />
    ) : session?.user ? (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex h-11 shrink-0 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium whitespace-nowrap text-silver transition-colors hover:text-ice xl:h-auto xl:border xl:border-white/15 xl:bg-white/5"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={26}
            height={26}
            className="h-6 w-6 shrink-0 rounded-full"
            unoptimized
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-glacier-500/30 text-[0.6rem] text-ice"
          >
            {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden sm:inline">Sign out</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="flex h-11 shrink-0 items-center rounded-full px-3 text-xs font-medium whitespace-nowrap text-silver transition-colors hover:text-ice xl:h-auto xl:border xl:border-white/15 xl:bg-white/5 xl:py-1.5"
      >
        Sign in
      </button>
    );

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 sm:px-6">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl rounded-3xl border border-white/15 bg-navy-900/60 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-2.5">
          {/* 1. Brand section. */}
          <Link
            href="/"
            className="shrink-0 font-mono text-[0.6rem] tracking-[0.25em] text-silver uppercase transition-colors hover:text-ice sm:text-[0.65rem] sm:tracking-[0.3em]"
          >
            {product.descriptor}
          </Link>

          {/* 2. Main navigation section — xl and up only, first point with
              room for all six links beside the call button and auth control. */}
          <nav
            aria-label="Main"
            className="hidden min-w-0 items-center gap-0.5 xl:flex"
          >
            {nav.links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                    active ? "bg-white/10 text-ice" : "text-silver hover:text-ice"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. Account and action section — the click-to-call button, the
              auth control, and the toggle that replaces both below xl. */}
          <div className="flex shrink-0 items-center gap-2">
            {phoneHref && (
              <a
                href={phoneHref}
                aria-label="Call Himalaya Sparsh"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium whitespace-nowrap text-silver transition-colors hover:text-ice"
              >
                <PhoneIcon />
                <span className="hidden sm:inline">Call Us</span>
              </a>
            )}

            <div className="hidden min-w-11 justify-end xl:flex">{authControl}</div>

            {/* Toggle — below xl only. */}
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-silver transition-colors hover:text-ice xl:hidden"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible panel — below xl only. */}
        {open && (
          <nav
            id={menuId}
            aria-label="Main"
            className="border-t border-white/10 px-3 pt-2 pb-3 xl:hidden"
          >
            <ul className="flex flex-col gap-1">
              {nav.links.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded-2xl px-4 py-3 text-sm font-medium tracking-wide transition-colors ${
                        active
                          ? "bg-white/10 text-ice"
                          : "text-silver hover:bg-white/5 hover:text-ice"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {phoneHref && (
                <li>
                  <a
                    href={phoneHref}
                    aria-label="Call Himalaya Sparsh"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium tracking-wide text-silver transition-colors hover:bg-white/5 hover:text-ice"
                  >
                    <PhoneIcon className="h-4 w-4 shrink-0" />
                    Call Us
                  </a>
                </li>
              )}
            </ul>
            <div className="mt-2 border-t border-white/10 px-4 pt-3">{authControl}</div>
          </nav>
        )}
      </div>
    </header>
  );
}
