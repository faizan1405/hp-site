"use client";

import Image from "next/image";
import type { Ref } from "react";
import { assets, brand, scenes } from "@/config/content";

type ProductRevealProps = {
  /** The whole scene layer — the timeline fades this in and out. */
  ref?: Ref<HTMLDivElement>;
  /** The bottle itself — scaled, blurred and lifted independently. */
  imageRef?: Ref<HTMLDivElement>;
  /** The glow behind the bottle. */
  glowRef?: Ref<HTMLDivElement>;
};

const { product } = scenes;

/**
 * Scene 4. On desktop the bottle sits to the right so the glacier face — the
 * most interesting part of the frame — stays uncovered.
 */
export function ProductReveal({ ref, imageRef, glowRef }: ProductRevealProps) {
  return (
    <div
      ref={ref}
      className="scene-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 md:justify-end md:px-16 lg:px-24"
    >
      <div className="flex w-full max-w-6xl flex-col items-center gap-8 md:flex-row-reverse md:justify-between md:gap-12">
        {/* Bottle */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div
            ref={glowRef}
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(111,191,230,0.38)_0%,rgba(111,191,230,0.12)_38%,transparent_70%)] blur-2xl"
          />
          <div
            ref={imageRef}
            className="relative h-[34vh] w-[44vw] max-w-[200px] md:h-[56vh] md:w-[26vw] md:max-w-[350px] md:min-w-[200px]"
          >
            <Image
              src={assets.product}
              alt={`${brand.name} ${product.name} bottle, front view`}
              fill
              // The bottle is the payoff of the whole scroll and is reused by
              // scene 6, so it is worth fetching up front rather than mid-scrub.
              priority
              sizes="(max-width: 768px) 44vw, 26vw"
              className="object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.55)]"
            />
          </div>

          {/* Reflection — pure decoration, desktop only. */}
          <div
            aria-hidden="true"
            className="relative hidden h-[13vh] w-[26vw] max-w-[350px] min-w-[200px] opacity-25 md:block"
            style={{
              maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, transparent 85%)",
            }}
          >
            <Image
              src={assets.product}
              alt=""
              fill
              sizes="26vw"
              className="scale-y-[-1] object-contain object-top blur-[2px]"
            />
          </div>
        </div>

        {/* Copy */}
        <div className="max-w-md text-center md:text-left">
          <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
            {product.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] font-light text-balance text-ice md:text-6xl">
            {product.name}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-pretty text-silver md:text-lg">
            {product.description}
          </p>
          <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-glacier-500/40 bg-glacier-500/10 px-4 py-2 font-mono text-[0.68rem] tracking-[0.28em] text-glacier-100 uppercase">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-glacier-300"
            />
            {product.badge}
          </p>
        </div>
      </div>
    </div>
  );
}
