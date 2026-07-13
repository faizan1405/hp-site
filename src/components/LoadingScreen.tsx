"use client";

import Image from "next/image";
import { assets, brand } from "@/config/content";

type LoadingScreenProps = {
  /** 0–100. */
  progress: number;
  /** Drives the fade-out; the element is removed once it finishes. */
  hidden: boolean;
};

export function LoadingScreen({ progress, hidden }: LoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-navy-900",
        "transition-opacity duration-700 ease-out",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-busy={!hidden}
    >
      <Image
        src={assets.logo}
        alt={brand.logoAlt}
        width={150}
        height={44}
        priority
        className="h-11 w-auto opacity-90"
      />

      <div className="flex w-56 flex-col gap-3">
        <div
          className="h-px w-full overflow-hidden bg-white/15"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading the glacier experience"
        >
          <div
            className="h-full bg-glacier-300 transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-[0.65rem] tracking-[0.3em] text-silver-dim uppercase">
            Preparing the experience
          </p>
          <p className="font-mono text-xs tabular-nums text-silver">{clamped}%</p>
        </div>
      </div>
    </div>
  );
}
