"use client";

import Image from "next/image";
import type { Ref } from "react";
import { assets, brand, contact, scenes, whatsappHref } from "@/config/content";

type FinalCTAProps = {
  ref?: Ref<HTMLElement>;
  /**
   * `overlay` — scene 6 inside the pinned stage.
   * `static`  — a normal document section, used by the fallbacks.
   */
  variant: "overlay" | "static";
};

const { cta } = scenes;

const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium tracking-wide transition-transform duration-200 sm:w-auto";

export function FinalCTA({ ref, variant }: FinalCTAProps) {
  const isOverlay = variant === "overlay";

  return (
    <section
      ref={ref}
      id="purchase"
      aria-label={`Buy ${cta.name}`}
      className={
        isOverlay
          ? // The scrim both closes the film out and keeps the small print legible
            // against the bright ice the video ends on.
            "scene-layer pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-t from-navy-900/95 via-navy-900/75 to-navy-900/55 px-6 py-12 md:px-12"
          : "relative flex items-center justify-center px-6 py-24 md:px-12"
      }
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-6 md:flex-row md:gap-16">
        <div className="relative h-[20vh] w-[32vw] max-w-[170px] shrink-0 md:h-[60vh] md:w-[26vw] md:max-w-[320px]">
          <Image
            src={assets.product}
            alt={`${brand.name} ${cta.name} bottle`}
            fill
            priority
            sizes="(max-width: 768px) 32vw, 26vw"
            className="object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.6)]"
          />
        </div>

        <div className="w-full text-center md:text-left">
          <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
            {cta.eyebrow}
          </p>

          <h2 className="mt-3 font-display text-3xl leading-[1.05] font-light text-balance text-ice sm:text-4xl md:text-6xl">
            {cta.name}
          </h2>

          <p className="mt-3 flex flex-col items-center gap-1 md:items-start">
            <span className="text-2xl font-light text-ice md:text-3xl">
              {cta.price}
            </span>
            <span className="text-xs tracking-wide text-silver">
              {cta.priceNote}
            </span>
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-pretty text-silver md:mx-0 md:text-base">
            {cta.description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <a
              id="buy-now"
              href={cta.buyHref}
              className={`${buttonBase} bg-ice text-navy-900 hover:scale-[1.02] hover:bg-white active:scale-100`}
            >
              {cta.buyLabel}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} border border-white/25 bg-white/5 text-ice hover:scale-[1.02] hover:bg-white/10 active:scale-100`}
            >
              {cta.whatsappLabel}
            </a>
          </div>

          <address className="mt-6 flex flex-col gap-1 text-xs leading-relaxed text-silver not-italic md:text-sm">
            <a
              href={`mailto:${contact.email}`}
              className="transition-colors hover:text-ice"
            >
              {contact.email}
            </a>
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              className="transition-colors hover:text-ice"
            >
              {contact.phone}
            </a>
            <span>{contact.address}</span>
          </address>
        </div>
      </div>
    </section>
  );
}
