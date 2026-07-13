"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FinalCTA } from "@/components/FinalCTA";
import {
  activeDeviceElements,
  assets,
  deviceImage,
  product,
  scenes,
} from "@/config/content";

type FallbackProps = {
  /**
   * `poster` — reduced motion or a failed video: a still frame, nothing moves.
   * `loop`   — weak device: the video plays normally as a muted looping backdrop.
   */
  background: "poster" | "loop";
};

const { opening, source, origin, descent, device, benefits } = scenes;

/**
 * The no-scrubbing path. Same story, same device, same call to action —
 * delivered as plain stacked sections that work without GSAP, without seeking,
 * and without a single blur if the device cannot afford one.
 *
 * The product stays fully visible here: reduced motion means less movement, not
 * less product.
 */
export function ReducedMotionFallback({ background }: FallbackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (background !== "loop") return;
    const video = videoRef.current;
    if (!video) return;

    // Autoplay can still be refused (low power mode); the poster stays behind it.
    void video.play().catch(() => {
      /* poster remains visible — nothing else to do */
    });
  }, [background]);

  return (
    <main className="relative">
      {/* Fixed backdrop, shared by every section. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
        {background === "loop" ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={assets.poster}
            preload="metadata"
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
          >
            <source src={assets.video} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={assets.poster}
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-navy-900/75" />
      </div>

      <section className="flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase">
          {product.descriptor}
        </p>
        <h1 className="mt-8 max-w-3xl font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-6xl md:text-7xl">
          {opening.headline}
        </h1>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
          {source.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
          {source.heading}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-pretty text-silver md:text-lg">
          {source.body}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
          {origin.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
          {origin.heading}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-pretty text-silver md:text-lg">
          {origin.body}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
          {descent.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
          {descent.heading}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-pretty text-silver md:text-lg">
          {descent.body}
        </p>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:gap-16 md:py-28">
        <div
          className="relative h-[48vh] w-auto shrink-0"
          style={{ aspectRatio: `${deviceImage.width} / ${deviceImage.height}` }}
        >
          <Image
            src={assets.device}
            alt={device.imageAlt}
            fill
            sizes="(max-width: 768px) 45vw, 240px"
            className="object-contain"
          />
        </div>

        <div className="text-center md:text-left">
          <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
            {device.intro.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
            {device.intro.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-pretty text-silver md:text-lg">
            {device.intro.body}
          </p>

          <h3 className="mt-10 font-display text-2xl leading-tight font-light text-balance text-ice md:text-3xl">
            {device.conversion.heading}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-pretty text-silver md:text-lg">
            {device.conversion.body}
          </p>
        </div>
      </section>

      {/* The stones, as a plain list. Empty until the verified list exists. */}
      {activeDeviceElements.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <ul className="grid gap-6 md:grid-cols-3">
            {activeDeviceElements.map((element) => (
              <li
                key={element.id}
                className="rounded-2xl border border-white/15 bg-navy-900/70 p-7"
              >
                <h3 className="font-mono text-[0.65rem] tracking-[0.3em] text-glacier-300 uppercase">
                  {element.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
                  {element.shortDescription}
                </p>
                {element.verifiedFunction && (
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-ice">
                    {element.verifiedFunction}
                  </p>
                )}
                {element.evidenceNote && (
                  <p className="mt-2 text-[0.7rem] leading-relaxed text-silver-dim">
                    {element.evidenceNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {benefits.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <ul className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <li
                key={benefit.id}
                className="rounded-2xl border border-white/15 bg-navy-900/70 p-7"
              >
                <h3 className="font-display text-2xl leading-tight font-light text-balance text-ice">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-pretty text-silver">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FinalCTA variant="static" />
    </main>
  );
}
