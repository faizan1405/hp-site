"use client";

import type { Ref } from "react";
import type { DeviceLayer } from "@/config/content";

type DeviceLayerCalloutProps = {
  ref?: Ref<HTMLDivElement>;
  layer: DeviceLayer;
  /** Position in the walk, for the "03 / 09" counter. */
  index: number;
  total: number;
};

/** Gap between the edge of the cutaway and the text column. */
const GAP = "3.5rem";

/**
 * One internal layer, named and explained, with a hairline connector running
 * from the text back to the exact point on the cutaway it describes.
 *
 * It is positioned inside the cutaway's own box, so `anchor` is simply a
 * percentage of that box — the line lands on the same stone at every screen size
 * and the drawing can be scaled freely.
 *
 * Below `lg` there is no room to overhang a text column beside a tall, narrow
 * column drawing, so the connector is dropped and the text sits underneath it
 * instead. Same content, same order, no cramped side layout. (HowItWorks reserves
 * the space it lands in.)
 *
 * The counter is here for a reason: the walk is nine steps long, and without it
 * a visitor five layers deep has no idea whether they are near the end.
 */
export function DeviceLayerCallout({
  ref,
  layer,
  index,
  total,
}: DeviceLayerCalloutProps) {
  const { name, description, verifiedFunction, evidenceNote, anchor, side } = layer;
  const isLeft = side === "left";

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const text = (
    <>
      <p className="font-mono text-[0.6rem] tracking-[0.3em] text-glacier-500/70 uppercase">
        {counter}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-tight font-light text-balance text-ice md:text-3xl">
        {name}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
        {description}
      </p>

      {/* Only ever rendered when the client has supplied verified wording. */}
      {verifiedFunction && (
        <p className="mt-3 text-sm leading-relaxed text-pretty text-ice">
          {verifiedFunction}
        </p>
      )}
      {evidenceNote && (
        <p className="mt-2 text-[0.7rem] leading-relaxed text-silver-dim">
          {evidenceNote}
        </p>
      )}
    </>
  );

  return (
    <div
      ref={ref}
      // Starts hidden. The scrubbed timeline is the only thing that reveals it.
      className="scene-layer pointer-events-none absolute inset-0"
    >
      {/* ---------- lg and up: connector line + text column beside the drawing ---------- */}

      {/* The hairline, from the anchor out past the edge of the box. Brightest at
          the device end, so the eye is pulled from the words to the material. */}
      <span
        aria-hidden="true"
        className={[
          "absolute hidden h-px -translate-y-1/2 lg:block",
          isLeft
            ? "bg-gradient-to-l from-glacier-300/80 to-glacier-300/10"
            : "bg-gradient-to-r from-glacier-300/80 to-glacier-300/10",
        ].join(" ")}
        style={
          isLeft
            ? {
                top: `${anchor.y}%`,
                left: `-${GAP}`,
                width: `calc(${anchor.x}% + ${GAP})`,
              }
            : {
                top: `${anchor.y}%`,
                left: `${anchor.x}%`,
                width: `calc(${100 - anchor.x}% + ${GAP})`,
              }
        }
      />

      <div
        className={[
          "absolute hidden w-64 -translate-y-1/2 lg:block xl:w-72",
          isLeft ? "text-right" : "text-left",
        ].join(" ")}
        style={
          isLeft
            ? { top: `${anchor.y}%`, right: `calc(100% + ${GAP})` }
            : { top: `${anchor.y}%`, left: `calc(100% + ${GAP})` }
        }
      >
        {text}
      </div>

      {/* ---------- below lg: stacked underneath, no connector ---------- */}
      <div className="absolute top-[calc(100%+1.25rem)] left-1/2 w-[min(22rem,86vw)] -translate-x-1/2 text-center lg:hidden">
        {text}
      </div>
    </div>
  );
}
