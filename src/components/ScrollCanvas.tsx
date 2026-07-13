"use client";

import type { RefObject } from "react";
import { assets } from "@/config/content";

type ScrollCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

/**
 * The full-viewport backdrop of the pinned experience: a canvas that
 * `GlacierExperience` paints one glacier frame into per animation frame, indexed
 * off scroll progress.
 *
 * It is decorative, so it stays hidden from assistive tech — the narrative lives
 * in the overlay headings, and the fallback path tells the same story in prose.
 */
export function ScrollCanvas({ canvasRef }: ScrollCanvasProps) {
  return (
    <div
      className="film-grain absolute inset-0 overflow-hidden bg-navy-900 bg-cover bg-center"
      // The poster sits behind the canvas so the very first paint is a glacier
      // rather than a black rectangle. It is already preloaded in the document
      // head, and the canvas covers it completely from the first frame onward.
      style={{ backgroundImage: `url(${assets.poster})` }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        tabIndex={-1}
      />

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
