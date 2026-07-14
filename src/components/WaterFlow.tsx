"use client";

import type { CSSProperties, Ref } from "react";

type WaterFlowProps = {
  /** The masking box. Position it with `className`; the water fills it exactly. */
  ref?: Ref<HTMLDivElement>;
  /** Where the box sits. The caller owns the geometry. */
  className?: string;
  style?: CSSProperties;
  /** How many droplets trail the front. Zero on mobile, where they are noise. */
  droplets?: number;
  /**
   * `screen` lets the stream read as light passing *through* the media it runs
   * over, rather than as a blue sheet laid on top of it. The finale pours into
   * open air and wants no blending at all.
   */
  blend?: "screen" | "none";
};

/**
 * A column of water that fills from the top, with a bright leading edge at the
 * front — used twice: once inside the cutaway, where it runs down through the
 * nine layers, and once in the finale, where it pours into the glass.
 *
 * ---------------------------------------------------------------------------
 * HOW IT MOVES
 * ---------------------------------------------------------------------------
 * The stream is one element as tall as its mask, and it is animated with nothing
 * but `yPercent`, from -100 (entirely above the mask, invisible) to 0 (filling
 * it). Because the gradient is brightest at its own bottom edge, that edge *is*
 * the water's front, and it travels the length of the column as the element
 * slides down. Everything the front has already passed is the body of the
 * gradient above it, which reads as wet.
 *
 * The whole effect is therefore a single composited transform. There is no
 * height animation, no clip-path, no per-frame layout, and no React state — and
 * it reverses exactly, because at any scroll position the transform is a pure
 * function of the timeline's progress.
 */
export function WaterFlow({
  ref,
  className = "",
  style,
  droplets = 0,
  blend = "screen",
}: WaterFlowProps) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
      style={{ ...style, mixBlendMode: blend === "screen" ? "screen" : undefined }}
    >
      {/* The stream. Faint where the water has already been, bright at the front.
          The leading edge is a child, so the single `yPercent` on this element
          carries it along — two elements sharing one transform, not two. */}
      <div
        data-stream
        className="absolute inset-0 bg-gradient-to-b from-glacier-500/15 via-glacier-500/25 to-glacier-100/85"
      >
        {/* A hairline of true white right on the front, so it reads as a moving
            surface rather than as the end of a gradient. */}
        <span className="absolute inset-x-0 bottom-0 block h-[3px] bg-ice/90 blur-[2px]" />
      </div>

      {/* Droplets. Each is a full-height wrapper with the drop pinned to its
          bottom edge, so the same `yPercent` trick walks it down the column
          without the drop itself being squashed by a scale. */}
      {/* `max-md:hidden` matters: the timeline only animates these on desktop, so
          on a phone they would otherwise sit motionless at the foot of the column. */}
      {Array.from({ length: droplets }, (_, index) => (
        <div
          key={index}
          data-droplet
          className="absolute inset-x-0 top-0 h-full max-md:hidden"
        >
          <span
            className="absolute bottom-0 block h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ice/80 shadow-[0_0_6px_2px_rgba(220,239,250,0.45)]"
            // Spread across the bore, deterministically — never Math.random(), or
            // the server and the client would disagree and React would complain.
            style={{ left: `${24 + index * 26}%` }}
          />
        </div>
      ))}
    </div>
  );
}
