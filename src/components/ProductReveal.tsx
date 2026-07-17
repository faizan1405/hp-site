"use client";

import Image from "next/image";
import Link from "next/link";
import type { Ref } from "react";
import { assets, commerce, deviceImage, scenes } from "@/config/content";
import { BuyNowWhatsAppButton } from "@/components/BuyNowWhatsAppButton";

type ProductRevealProps = {
  /** The whole scene layer — the timeline fades this in and out. */
  ref?: Ref<HTMLDivElement>;
  /** The device itself: scaled, lifted and tilted independently. */
  deviceRef?: Ref<HTMLDivElement>;
  /** Darkens the glacier behind the device so it reads against bright ice. */
  backdropRef?: Ref<HTMLDivElement>;
  /** Glacier-blue bloom behind the device. */
  glowRef?: Ref<HTMLDivElement>;
  /** The bar of light that travels across the device. */
  sweepRef?: Ref<HTMLDivElement>;
  /** Drifting mist. Desktop only. */
  mistRef?: Ref<HTMLDivElement>;
  /** Ground reflection. Desktop only. */
  reflectionRef?: Ref<HTMLDivElement>;
  /** The copy beside it — what the device is. */
  introRef?: Ref<HTMLDivElement>;
};

const { device, cta } = scenes;

/** The device render's own aspect ratio — a tall, narrow cylinder. */
const DEVICE_ASPECT = `${deviceImage.width} / ${deviceImage.height}`;

/**
 * Scene 5 — the device, seen from outside.
 *
 * A 2.5D reveal built from the single supplied PNG. The device is the only thing
 * that moves in depth: it rises, settles and drifts, while the glow, the sweep,
 * the reflection and the mist sit on their own layers behind and in front of it.
 * Then it dissolves, and HowItWorks takes over with the cutaway.
 *
 * The box is locked to the render's real aspect ratio, so `object-contain` fills
 * it exactly — the device can never stretch, and nothing shifts as it loads.
 *
 * Deliberately NOT a turntable: one flat PNG has no back and no sides, so the
 * tilt stays within a few degrees and reads as parallax. A real rotation needs a
 * GLB, a shot image sequence, or a pre-rendered rotation — not a PNG spun on its
 * Y axis, which would simply show the visitor a mirrored front.
 */
export function ProductReveal({
  ref,
  deviceRef,
  backdropRef,
  glowRef,
  sweepRef,
  mistRef,
  reflectionRef,
  introRef,
}: ProductRevealProps) {
  return (
    <div
      ref={ref}
      data-scene="device"
      className="scene-layer pointer-events-none absolute inset-0"
    >
      {/* Contrast bed. The device is mid-tone copper and the footage ends on
          bright ice, so without this it has nothing to sit against. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_55%,rgba(6,19,33,0.62)_0%,rgba(6,19,33,0.9)_100%)]"
      />

      <div className="relative flex h-full w-full items-center justify-center px-6 md:px-10 lg:px-16">
        <div className="grid w-full max-w-5xl items-center gap-y-8 md:grid-cols-2 md:gap-x-16">
          {/* ---------------------------- Device ---------------------------- */}
          {/* `isolate` keeps the mist's negative z-index inside this column.
              Without it the mist would sit behind the darkening backdrop above
              and never be seen. */}
          <div className="relative isolate mx-auto flex flex-col items-center">
            {/* 3D context. Perspective must live on the parent, not on the
                element being rotated, or the tilt reads as a flat skew. */}
            <div
              className="relative"
              style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
            >
              <div
                ref={deviceRef}
                data-device-img
                className="relative h-[36vh] md:h-[58vh] lg:h-[62vh]"
                style={{ aspectRatio: DEVICE_ASPECT, transformStyle: "preserve-3d" }}
              >
                {/* Bloom behind the device. */}
                <div
                  ref={glowRef}
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 -z-10 h-[112%] w-[420%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(111,191,230,0.32)_0%,rgba(111,191,230,0.1)_40%,transparent_72%)] blur-lg md:blur-2xl"
                />

                <Image
                  src={assets.device}
                  alt={device.imageAlt}
                  fill
                  // The payoff of the whole scroll, and reused by the finale and
                  // the CTA. Fetch it up front rather than mid-scrub — but as
                  // `eager`, not `preload`: the poster is the LCP element and
                  // should keep the one preload slot.
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 45vw, 280px"
                  className="object-contain drop-shadow-[0_30px_55px_rgba(0,0,0,0.6)]"
                />

                {/* Light sweep. The mask is an alpha silhouette of the very same
                    render, so the bar of light is clipped to the device and
                    travels across the copper instead of across a rectangle. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={{
                    maskImage: `url(${assets.deviceMask})`,
                    WebkitMaskImage: `url(${assets.deviceMask})`,
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                  }}
                >
                  <div
                    ref={sweepRef}
                    className="absolute inset-y-0 left-0 w-[65%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent md:blur-[3px]"
                  />
                </div>
              </div>

              {/* Ground reflection. Pure decoration and the cheapest thing to
                  drop, so it is desktop-only. */}
              <div
                ref={reflectionRef}
                aria-hidden="true"
                className="relative hidden h-[16vh] w-full opacity-0 md:block"
                style={{
                  maskImage: "linear-gradient(to bottom, black 0%, transparent 82%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, transparent 82%)",
                }}
              >
                <Image
                  src={assets.device}
                  alt=""
                  fill
                  sizes="280px"
                  className="scale-y-[-1] object-contain object-top blur-[3px]"
                />
              </div>
            </div>

            {/* Mist. Two soft banks, moved by the timeline rather than by a CSS
                loop, so they cost nothing while the scene is off screen. */}
            <div
              ref={mistRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[-60%] bottom-[6%] -z-10 hidden h-[38%] opacity-0 md:block"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,239,250,0.16)_0%,transparent_65%)] blur-2xl" />
              <div className="absolute inset-x-[12%] bottom-0 h-[70%] bg-[radial-gradient(ellipse_at_center,rgba(159,212,240,0.14)_0%,transparent_60%)] blur-xl" />
            </div>
          </div>

          {/* ----------------------------- Copy ----------------------------- */}
          <div ref={introRef} className="scene-layer text-center md:text-left">
            <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
              {device.intro.eyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] font-light text-balance text-ice md:text-5xl lg:text-6xl">
              {device.intro.heading}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-silver md:text-lg">
              {device.intro.body}
            </p>

            {/* The scene layer above is `pointer-events-none` for the scrubbed
                animation's sake, so these need their own `pointer-events-auto`
                to stay clickable while the scene is on screen. */}
            <div className="pointer-events-auto mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              {commerce.amountInPaise && (
                <Link
                  href="/checkout"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-ice px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors duration-200 hover:bg-white"
                >
                  {cta.buyLabel}
                </Link>
              )}
              <BuyNowWhatsAppButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-medium tracking-wide text-navy-900 transition-colors duration-200 hover:bg-[#22c15e]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
