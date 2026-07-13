"use client";

import type { ReactNode, Ref } from "react";

type StoryOverlayProps = {
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
  /** Where the block sits inside the pinned viewport. */
  placement?: "center" | "lower" | "left";
  /** Scene 6 needs real clicks; every other layer must let scrolls through. */
  interactive?: boolean;
  className?: string;
};

const placements: Record<NonNullable<StoryOverlayProps["placement"]>, string> = {
  center: "items-center justify-center text-center",
  lower: "items-end justify-center pb-24 text-center md:pb-28",
  left: "items-center justify-start text-left",
};

/**
 * A single absolutely-positioned narrative layer inside the pinned stage.
 * Starts hidden (`.scene-layer`) and is revealed by the scrubbed GSAP timeline,
 * so the copy is still present in the server-rendered HTML for crawlers.
 */
export function StoryOverlay({
  ref,
  children,
  placement = "center",
  interactive = false,
  className = "",
}: StoryOverlayProps) {
  return (
    <div
      ref={ref}
      className={[
        "scene-layer absolute inset-0 flex px-6 md:px-12",
        placements[placement],
        interactive ? "pointer-events-auto" : "pointer-events-none",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
