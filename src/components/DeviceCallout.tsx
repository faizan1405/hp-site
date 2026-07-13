"use client";

import type { Ref } from "react";
import type { DeviceElement } from "@/config/content";

type DeviceCalloutProps = {
  ref?: Ref<HTMLDivElement>;
  element: DeviceElement;
};

/**
 * One stone called out beside the device, with a hairline connector running from
 * the text to a point on the device itself.
 *
 * Positioned inside the device's own box, so `anchor` is simply a percentage of
 * that box and the line always lands on the same part of the render at every
 * screen size. The text overhangs the box into the surrounding whitespace.
 *
 * Below `lg` there is no room for that overhang, so the connector is dropped and
 * the text sits under the device instead — same content, no cramped side layout.
 */
export function DeviceCallout({ ref, element }: DeviceCalloutProps) {
  const { name, shortDescription, verifiedFunction, evidenceNote, anchor } =
    element;

  const x = anchor?.x ?? 50;
  const y = anchor?.y ?? 50;
  const side = element.side ?? "left";
  const isLeft = side === "left";

  /** Gap between the device's edge and the text column. */
  const GAP = "3.5rem";

  const text = (
    <>
      <p className="font-mono text-[0.6rem] tracking-[0.3em] text-glacier-300 uppercase">
        {name}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-silver">
        {shortDescription}
      </p>
      {verifiedFunction && (
        <p className="mt-2 text-sm leading-relaxed text-pretty text-ice">
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
      // Starts hidden; the scrubbed timeline is what brings it in.
      className="scene-layer pointer-events-none absolute inset-0"
    >
      {/* ---------- lg and up: anchored to the device, with a connector ---------- */}

      {/* The point on the device the line lands on. */}
      <span
        aria-hidden="true"
        className="absolute hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glacier-300 shadow-[0_0_10px_2px_rgba(159,212,240,0.5)] lg:block"
        style={{ left: `${x}%`, top: `${y}%` }}
      />

      {/* The hairline itself: from the anchor, out past the edge of the box. */}
      <span
        aria-hidden="true"
        className={[
          "absolute hidden h-px -translate-y-1/2 lg:block",
          isLeft
            ? "bg-gradient-to-l from-glacier-300/70 to-glacier-300/10"
            : "bg-gradient-to-r from-glacier-300/70 to-glacier-300/10",
        ].join(" ")}
        style={
          isLeft
            ? { top: `${y}%`, left: `-${GAP}`, width: `calc(${x}% + ${GAP})` }
            : {
                top: `${y}%`,
                left: `${x}%`,
                width: `calc(${100 - x}% + ${GAP})`,
              }
        }
      />

      <div
        className={[
          "absolute hidden w-60 -translate-y-1/2 lg:block",
          isLeft ? "text-right" : "text-left",
        ].join(" ")}
        style={
          isLeft
            ? { top: `${y}%`, right: `calc(100% + ${GAP})` }
            : { top: `${y}%`, left: `calc(100% + ${GAP})` }
        }
      >
        {text}
      </div>

      {/* ---------- below lg: under the device, no connector ---------- */}
      <div className="absolute top-[calc(100%+1.5rem)] left-1/2 w-[min(20rem,80vw)] -translate-x-1/2 text-center lg:hidden">
        {text}
      </div>
    </div>
  );
}
