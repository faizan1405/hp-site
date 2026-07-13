"use client";

import type { Ref } from "react";
import type { Benefit } from "@/config/content";

type BenefitCardProps = {
  ref?: Ref<HTMLDivElement>;
  benefit: Benefit;
  index: number;
  total: number;
};

/**
 * Minimal glass card. One is visible at a time; the timeline cross-fades them.
 * The backdrop blur is the most expensive layer on the page, so mobile gets a
 * flat translucent panel instead (see the `md:` variants).
 */
export function BenefitCard({ ref, benefit, index, total }: BenefitCardProps) {
  return (
    <div
      ref={ref}
      className="scene-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6"
    >
      <article className="w-full max-w-xl rounded-2xl border border-white/15 bg-navy-900/75 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] md:bg-navy-900/40 md:p-12 md:backdrop-blur-xl">
        <p className="mb-5 font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h3 className="font-display text-3xl leading-tight font-light text-balance text-ice md:text-5xl">
          {benefit.title}
        </h3>
        <p className="mt-5 text-base leading-relaxed text-pretty text-silver md:text-lg">
          {benefit.description}
        </p>
        {/* Where the claim comes from. A benefit without one is a benefit we
            should not be printing — see the note above `verifiedBenefits`. */}
        {benefit.evidenceNote && (
          <p className="mt-4 text-[0.7rem] leading-relaxed text-silver-dim">
            {benefit.evidenceNote}
          </p>
        )}
      </article>
    </div>
  );
}
