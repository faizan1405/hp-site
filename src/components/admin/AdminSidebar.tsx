"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
] as const;

type AdminUser = {
  name: string | null;
  email: string;
  image: string | null;
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-glacier-50 text-glacier-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
          {user.image ? (
            <Image src={user.image} alt="" fill sizes="36px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{user.name ?? "Admin"}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        View website ↗
      </Link>
      <SignOutButton className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" />
    </div>
  );
}

/**
 * Admin navigation: a fixed left sidebar from `lg` up, and a slide-over panel
 * behind a hamburger button below it. Deliberately plain — a light background,
 * simple borders, no gradients or motion beyond the panel's own open/close —
 * this is a working tool for a non-technical client, not the public site.
 */
export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="px-3 text-base font-semibold text-gray-900">
          Himalaya Sparsh
          <span className="block text-xs font-normal text-gray-500">Admin</span>
        </Link>
        <div className="mt-6 flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <SidebarFooter user={user} />
      </aside>

      {/* Mobile top bar. */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-sm font-semibold text-gray-900">
          Himalaya Sparsh <span className="font-normal text-gray-500">Admin</span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile slide-over. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white px-4 py-6 shadow-xl"
          >
            <div className="flex items-center justify-between px-3">
              <span className="text-sm font-semibold text-gray-900">Himalaya Sparsh Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flex-1">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter user={user} />
          </div>
        </div>
      )}
    </>
  );
}
