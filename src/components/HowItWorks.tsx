"use client";

import type { Ref, RefObject } from "react";
import { CUTAWAY_BORE, DeviceCutaway } from "@/components/DeviceCutaway";
import { DeviceLayerCallout } from "@/components/DeviceLayerCallout";
import { WaterFlow } from "@/components/WaterFlow";
import { cutawayViewBox, deviceLayers, scenes } from "@/config/content";

const { howItWorks } = scenes;

const CUTAWAY_ASPECT = `${cutawayViewBox.width} / ${cutawayViewBox.height}`;

type HowItWorksProps = {
  /** The whole scene layer. The timeline fades this in and out. */
  ref?: Ref<HTMLDivElement>;
  /** Darkens the glacier behind the cutaway so the drawing reads. */
  backdropRef?: Ref<HTMLDivElement>;
  /** The cutaway itself: scaled and tilted as the exterior device dissolves into it. */
  cutawayRef?: Ref<HTMLDivElement>;
  /** The water column. GlacierExperience selects the stream and droplets inside it. */
  waterRef?: Ref<HTMLDivElement>;
  /** Eyebrow, heading and body. Holds through the walk on desktop. */
  headingRef?: Ref<HTMLDivElement>;
  /** The composition disclosure. Present for the whole section. */
  noteRef?: Ref<HTMLParagraphElement>;
  /** One entry per layer, in `deviceLayers` order. */
  calloutRefs?: RefObject<(HTMLDivElement | null)[]>;
};

/**
 * Scene 6 — how the device works.
 *
 * The exterior device dissolves into this: a drawn cutaway of the column, with
 * the nine materials stacked inside it in the order the water meets them. As the
 * visitor scrolls, exactly one of them is lit at a time — the others drop to a
 * dim base, a halo comes up behind the active one, a hairline connects it to its
 * name, and the water front arrives at it. Scrolling back up runs all of that
 * backwards, because every one of those is a tween on a scrubbed timeline rather
 * than a state machine reacting to a scroll event.
 *
 * This file only decides where things are. Every value that moves is animated by
 * GlacierExperience through the refs above and the `data-` attributes below.
 */
export function HowItWorks({
  ref,
  backdropRef,
  cutawayRef,
  waterRef,
  headingRef,
  noteRef,
  calloutRefs,
}: HowItWorksProps) {
  return (
    <div
      ref={ref}
      data-scene="how-it-works"
      className="scene-layer pointer-events-none absolute inset-0"
    >
      {/* Nearly opaque. The glacier has done its job by now, and a drawing this
          fine cannot be read against moving ice. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(75%_65%_at_50%_50%,rgba(6,19,33,0.86)_0%,rgba(6,19,33,0.97)_100%)]"
      />

      <div className="relative flex h-full w-full items-center justify-center px-6 lg:px-16">
        {/* ------------------------------- Copy ------------------------------- */}
        <div
          ref={headingRef}
          className="scene-layer absolute inset-x-6 top-[7vh] mx-auto max-w-md text-center lg:inset-x-auto lg:top-1/2 lg:left-16 lg:mx-0 lg:max-w-xs lg:-translate-y-1/2 lg:text-left xl:left-24"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
            {howItWorks.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl leading-[1.05] font-light text-balance text-ice lg:text-5xl">
            {howItWorks.heading}
          </h2>
          {/* On a phone this space belongs to the cutaway. */}
          <p className="mt-5 hidden text-base leading-relaxed text-pretty text-silver lg:block">
            {howItWorks.body}
          </p>
        </div>

        {/* ----------------------------- Cutaway ----------------------------- */}
        {/* Perspective lives on the parent, or the tilt as the device turns into
            its own cross-section reads as a flat skew. */}
        {/* Lifted below `lg`, where the callout text lands underneath the drawing
            instead of beside it and needs the lower half of the stage. The shift
            lives on the parent because the child carries the timeline's own
            transform and the two would overwrite each other. */}
        <div
          className="relative -translate-y-[7vh] lg:translate-y-0"
          style={{ perspective: "1600px" }}
        >
          <div
            ref={cutawayRef}
            className="relative h-[40vh] md:h-[46vh] lg:h-[66vh]"
            style={{ aspectRatio: CUTAWAY_ASPECT, transformStyle: "preserve-3d" }}
          >
            <DeviceCutaway />

            {/* The water. Sits exactly over the bore, and over nothing else — the
                geometry comes from the drawing itself rather than from a guess. */}
            <WaterFlow
              ref={waterRef}
              className="absolute"
              style={{
                left: `${CUTAWAY_BORE.left}%`,
                top: `${CUTAWAY_BORE.top}%`,
                width: `${CUTAWAY_BORE.width}%`,
                height: `${CUTAWAY_BORE.height}%`,
              }}
              droplets={3}
            />

            {/* Anchored inside the cutaway's box, so an anchor is a percentage of
                the drawing and the connector always lands on the same stone. */}
            {deviceLayers.map((layer, index) => (
              <DeviceLayerCallout
                key={layer.id}
                ref={(node) => {
                  if (calloutRefs) calloutRefs.current[index] = node;
                }}
                layer={layer}
                index={index}
                total={deviceLayers.length}
              />
            ))}
          </div>
        </div>

        {/* --------------------------- Disclosure ---------------------------- */}
        {/* Deliberately not hidden away. It is the reason this section is
            publishable: it describes a build, and declines to claim a result. */}
        <p
          ref={noteRef}
          className="scene-layer absolute inset-x-6 bottom-6 mx-auto max-w-2xl text-center text-[0.68rem] leading-relaxed text-pretty text-silver-dim lg:bottom-8"
        >
          {howItWorks.sourceNote}
        </p>
      </div>

      {/* The walk is a visual sequence: its callouts are transform-and-opacity
          layers, which are invisible to assistive tech for most of the scroll.
          The same content, in the same order, as a plain list. */}
      <div className="sr-only">
        <h2>{howItWorks.heading}</h2>
        <p>{howItWorks.body}</p>
        <ol>
          {deviceLayers.map((layer) => (
            <li key={layer.id}>
              <h3>{layer.name}</h3>
              <p>{layer.description}</p>
              {layer.verifiedFunction && <p>{layer.verifiedFunction}</p>}
              {layer.sourceNote && (
                <p>
                  {layer.sourceNote}
                  {layer.verificationStatus && <> · {layer.verificationStatus}</>}
                </p>
              )}
            </li>
          ))}
        </ol>
        <p>{howItWorks.sourceNote}</p>
      </div>
    </div>
  );
}
