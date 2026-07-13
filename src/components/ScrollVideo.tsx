"use client";

import type { RefObject } from "react";
import { assets } from "@/config/content";

type ScrollVideoProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
};

/**
 * The full-viewport video canvas. It never plays on its own — `GlacierExperience`
 * drives `currentTime` from scroll progress. It is decorative, so it stays hidden
 * from assistive tech; the narrative lives in the overlay headings.
 */
export function ScrollVideo({ videoRef }: ScrollVideoProps) {
  return (
    <div className="film-grain absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster={assets.poster}
        preload="auto"
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src={assets.video} type="video/mp4" />
      </video>

      {/* Keeps editorial text legible over bright ice and dark rock alike. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-900/75 via-navy-900/25 to-navy-900/85"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_35%,rgba(6,19,33,0.7)_100%)]"
      />
    </div>
  );
}
