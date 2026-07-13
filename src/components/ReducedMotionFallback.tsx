"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FinalCTA } from "@/components/FinalCTA";
import { assets, brand, scenes } from "@/config/content";

type FallbackProps = {
  /**
   * `poster` — reduced motion or a failed video: a still frame, nothing moves.
   * `loop`   — weak device: the video plays normally as a muted looping backdrop.
   */
  background: "poster" | "loop";
};

const { opening, source, journey, product, benefits } = scenes;

/**
 * The no-scrubbing path. Same story, same product, same call to action —
 * delivered as plain stacked sections that work without GSAP, without seeking,
 * and without a single blur if the device cannot afford one.
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
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-navy-900/75" />
      </div>

      <section className="flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
        <Image
          src={assets.logo}
          alt={brand.logoAlt}
          width={170}
          height={50}
          priority
          className="h-12 w-auto"
        />
        <h1 className="mt-10 max-w-3xl font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-6xl md:text-7xl">
          {opening.headline}
        </h1>
        <p className="mt-6 text-sm tracking-[0.3em] text-silver-dim uppercase">
          {brand.tagline}
        </p>
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

      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
          {journey.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
          {journey.heading}
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3">
          {journey.highlights.map((highlight) => (
            <li key={highlight.title}>
              <h3 className="text-base font-medium text-ice">{highlight.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-silver">
                {highlight.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:gap-16 md:py-28">
        <div className="relative h-[42vh] w-full max-w-[260px] shrink-0">
          <Image
            src={assets.product}
            alt={`${brand.name} ${product.name} bottle, front view`}
            fill
            sizes="(max-width: 768px) 60vw, 260px"
            className="object-contain"
          />
        </div>
        <div className="text-center md:text-left">
          <p className="text-[0.7rem] font-medium tracking-[0.35em] text-glacier-300 uppercase">
            {product.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight font-light text-balance text-ice md:text-5xl">
            {product.name}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-pretty text-silver md:text-lg">
            {product.description}
          </p>
          <p className="mt-6 inline-block rounded-full border border-glacier-500/40 bg-glacier-500/10 px-4 py-2 text-[0.68rem] font-medium tracking-[0.28em] text-glacier-100 uppercase">
            {product.badge}
          </p>
        </div>
      </section>

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

      <FinalCTA variant="static" />
    </main>
  );
}
