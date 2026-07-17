"use client";

import Image from "next/image";
import Link from "next/link";
import type { Ref } from "react";
import { assets, commerce, contact, deviceImage, scenes } from "@/config/content";
import { BuyNowWhatsAppButton } from "@/components/BuyNowWhatsAppButton";

type FinalCTAProps = {
  ref?: Ref<HTMLElement>;
  /**
   * `overlay` — scene 7 inside the pinned stage.
   * `static`  — a normal document section, used by the fallbacks.
   */
  variant: "overlay" | "static";
};

const { cta, device } = scenes;

const buttonBase =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 sm:w-auto";

/**
 * The last scene. Two real actions: Buy Now (the actual online checkout —
 * hidden while `commerce.amountInPaise` is unset, per "THE NULL RULE" in
 * content.ts, since a dead `href="#"` would look like a working button and
 * take the visitor nowhere) and Enquire on WhatsApp (always real — the
 * number is confirmed).
 */
export function FinalCTA({ ref, variant }: FinalCTAProps) {
  const isOverlay = variant === "overlay";
  const hasContact = Boolean(
    contact.email || contact.phone || contact.address || contact.hours,
  );

  return (
    <section
      ref={ref}
      id="purchase"
      // Focusable so the "skip to the end" control has somewhere to land even
      // when there is no buy button to focus.
      tabIndex={-1}
      aria-label={`${cta.heading} — enquire`}
      className={
        isOverlay
          ? // The scrim both closes the film out and keeps the small print legible
            // against the bright ice the video ends on.
            "scene-layer pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-t from-navy-900/95 via-navy-900/75 to-navy-900/55 px-6 py-12 md:px-12"
          : "relative flex items-center justify-center px-6 py-24 md:px-12"
      }
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:flex-row md:gap-16">
        <div
          className="relative h-[18vh] shrink-0 md:h-[52vh]"
          style={{ aspectRatio: `${deviceImage.width} / ${deviceImage.height}` }}
        >
          <Image
            src={assets.device}
            alt={device.imageAlt}
            fill
            sizes="(max-width: 768px) 25vw, 220px"
            className="object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.6)]"
          />
        </div>

        <div className="w-full text-center md:text-left">
          <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
            {cta.eyebrow}
          </p>

          <h2 className="mt-3 font-display text-3xl leading-[1.05] font-light text-balance text-ice sm:text-4xl md:text-5xl">
            {cta.heading}
          </h2>

          {commerce.price && (
            <p className="mt-3 flex flex-col items-center gap-1 md:items-start">
              <span className="text-2xl font-light text-ice md:text-3xl">
                {commerce.price}
              </span>
              {commerce.priceNote && (
                <span className="text-xs tracking-wide text-silver">
                  {commerce.priceNote}
                </span>
              )}
            </p>
          )}

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-pretty text-silver md:mx-0 md:text-base">
            {cta.body}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            {commerce.amountInPaise && (
              <Link
                id="buy-now"
                href="/checkout"
                className={`${buttonBase} bg-ice text-navy-900 hover:bg-white`}
              >
                {cta.buyLabel}
              </Link>
            )}
            <BuyNowWhatsAppButton
              className={`${buttonBase} gap-2 bg-[#25D366] text-navy-900 hover:bg-[#22c15e]`}
            />
          </div>

          {hasContact && (
            <address className="mt-6 flex flex-col gap-1 text-xs leading-relaxed text-silver not-italic md:text-sm">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-ice"
                >
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="transition-colors hover:text-ice"
                >
                  {contact.phone}
                </a>
              )}
              {contact.address && <span>{contact.address}</span>}
              {contact.hours && <span>{contact.hours}</span>}
            </address>
          )}
        </div>
      </div>
    </section>
  );
}
