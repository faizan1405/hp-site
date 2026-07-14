"use client";

import Image from "next/image";
import type { Ref } from "react";
import { WaterFlow } from "@/components/WaterFlow";
import { assets, deviceImage, scenes } from "@/config/content";

const { finale, device } = scenes;

const DEVICE_ASPECT = `${deviceImage.width} / ${deviceImage.height}`;

type WaterFinaleProps = {
  /** The whole scene layer. */
  ref?: Ref<HTMLDivElement>;
  backdropRef?: Ref<HTMLDivElement>;
  /** The device, which lifts a little as it pours. */
  deviceRef?: Ref<HTMLDivElement>;
  /** The stream running from the outlet down into the glass. */
  pourRef?: Ref<HTMLDivElement>;
  /** The glass. GlacierExperience animates `[data-fill-clip]` and
   * `[data-fill-meniscus]` inside it. */
  glassRef?: Ref<HTMLDivElement>;
  copyRef?: Ref<HTMLDivElement>;
};

/**
 * Scene 8 — the finale: water leaving the column and filling a glass.
 *
 * The last thing the visitor sees before the call to action, and the one place a
 * product like this is usually tempted to lie. There is no pH figure on this
 * screen, no mineral count, no "before" glass next to an "after" glass, and no
 * colour-change strip — the client has supplied no test results, so the shot is
 * the water and nothing else. Every one of those elements is a single line of
 * markup away once there is a report to back it up.
 *
 * The pour reuses WaterFlow, the same component that runs the column inside the
 * cutaway: same transform, same reversibility, different box.
 */
export function WaterFinale({
  ref,
  backdropRef,
  deviceRef,
  pourRef,
  glassRef,
  copyRef,
}: WaterFinaleProps) {
  return (
    <div
      ref={ref}
      data-scene="finale"
      className="scene-layer pointer-events-none absolute inset-0"
    >
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_55%,rgba(6,19,33,0.72)_0%,rgba(6,19,33,0.95)_100%)]"
      />

      <div className="relative flex h-full w-full items-center justify-center px-6 md:px-12">
        <div className="grid w-full max-w-5xl items-center gap-y-10 md:grid-cols-2 md:gap-x-16">
          {/* ----------------------------- Visual ----------------------------- */}
          <div className="flex flex-col items-center">
            <div
              ref={deviceRef}
              className="relative h-[26vh] md:h-[36vh]"
              style={{ aspectRatio: DEVICE_ASPECT }}
            >
              <Image
                src={assets.device}
                alt={device.imageAlt}
                fill
                sizes="(max-width: 768px) 30vw, 200px"
                className="object-contain drop-shadow-[0_30px_55px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* The stream. Narrow, unblended: it is falling through air here, not
                running through stone, so there is nothing to see it through. */}
            <WaterFlow
              ref={pourRef}
              blend="none"
              droplets={0}
              className="relative h-[5vh] w-[4px] rounded-full md:h-[7vh] md:w-[5px]"
            />

            <div ref={glassRef} className="relative h-[13vh] md:h-[17vh]">
              <Glass />
            </div>
          </div>

          {/* ------------------------------ Copy ------------------------------ */}
          <div ref={copyRef} className="scene-layer text-center md:text-left">
            <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
              {finale.eyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] font-light text-balance text-ice md:text-5xl">
              {finale.heading}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-pretty text-silver md:text-lg">
              {finale.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A plain tumbler. The water body and its meniscus are drawn once, at their
 * final full-glass size and position, and stay that way — the glass fills by
 * *reveal*, not by transform. `[data-fill-clip]` is a rect inside its own
 * nested `<clipPath>`; GlacierExperience animates that rect's own `y` and
 * `height` attributes from the floor of the glass (nothing showing) up to the
 * top (everything showing). `[data-fill-meniscus]` sits outside that clip and
 * has its `cy` driven in lockstep, so the bright surface line is never itself
 * masked by the reveal it is there to mark.
 */
function Glass() {
  return (
    <svg
      viewBox="0 0 120 145"
      role="img"
      aria-label={finale.glassAlt}
      className="h-full w-auto"
    >
      <defs>
        <clipPath id="glass-interior">
          <path d="M27 16 L38.5 128 Q40 132 46 132 L74 132 Q80 132 81.5 128 L93 16 Z" />
        </clipPath>
        {/* The water level. Starts collapsed to zero height at the floor
            (y=132, the same bottom the interior path closes on) and is
            animated open toward the top (y=16, a completely full glass). */}
        <clipPath id="glass-fill-level">
          <rect data-fill-clip x="0" y="132" width="120" height="0" />
        </clipPath>
        <linearGradient id="glass-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dceffa" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#6fbfe6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3d94c4" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <g clipPath="url(#glass-interior)">
        {/* The body: full glass size, always. What is visible of it at any
            moment is entirely down to `glass-fill-level` above. */}
        <g clipPath="url(#glass-fill-level)">
          <rect x="24" y="16" width="72" height="116" fill="url(#glass-water)" />
        </g>

        {/* The meniscus. Clipped only to the interior shape, not to the fill
            level — its position (not its visibility) is what tracks the
            rising water. */}
        <ellipse
          data-fill-meniscus
          cx="60"
          cy="132"
          rx="35"
          ry="2.6"
          fill="#f4f9fc"
          fillOpacity="0.55"
        />
      </g>

      {/* The glass itself, over the water. */}
      <path
        d="M24 12 L36 130 Q38 136 46 136 L74 136 Q82 136 84 130 L96 12"
        fill="none"
        stroke="#dceffa"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="60"
        cy="12"
        rx="36"
        ry="5"
        fill="none"
        stroke="#dceffa"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      {/* One highlight down the left wall. Glass without a specular reads as plastic. */}
      <path
        d="M31 22 L41 122"
        fill="none"
        stroke="#f4f9fc"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
