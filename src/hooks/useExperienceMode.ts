"use client";

import { useSyncExternalStore } from "react";

/**
 * `scrub`   — full scroll-controlled video experience.
 * `reduced` — user asked for reduced motion: poster + static content, no scrubbing.
 * `lite`    — weak device or saver mode: looping background video, static content.
 */
export type ExperienceMode = "scrub" | "reduced" | "lite";

type NetworkInformation = {
  saveData?: boolean;
};

type ExtendedNavigator = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformation;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function detectMode(): ExperienceMode {
  if (window.matchMedia(REDUCED_MOTION).matches) return "reduced";

  const nav = navigator as ExtendedNavigator;

  // Data Saver is an explicit choice, so it is worth honouring. Connection speed
  // deliberately is *not* consulted: `effectiveType` reports "3g" on a cold
  // profile before the browser's estimator has warmed up, which would drop a
  // first-time visitor on fibre into the fallback. A genuinely slow link is
  // caught instead by the metadata timeout in GlacierExperience.
  if (nav.connection?.saveData) return "lite";

  // deviceMemory / hardwareConcurrency are missing on some browsers (notably
  // Safari); treating "unknown" as capable keeps the full experience as default.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3) return "lite";
  if (
    typeof nav.hardwareConcurrency === "number" &&
    nav.hardwareConcurrency > 0 &&
    nav.hardwareConcurrency <= 3
  ) {
    return "lite";
  }

  // Very small viewports rarely have the decode headroom for frame-accurate seeking.
  if (window.matchMedia("(max-width: 380px)").matches) return "lite";

  return "scrub";
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** The mode is a plain string, so React's referential check is satisfied. */
const getSnapshot = (): ExperienceMode | null => detectMode();

/**
 * Server-side there is no navigator, so the mode is unknown. React hydrates with
 * this value and immediately re-renders with the real one — which is why the
 * loading screen is what the first paint shows.
 */
const getServerSnapshot = (): ExperienceMode | null => null;

export function useExperienceMode(): ExperienceMode | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
