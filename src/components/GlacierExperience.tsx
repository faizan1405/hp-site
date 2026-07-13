"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { BenefitsSequence } from "@/components/BenefitsSequence";
import { FinalCTA } from "@/components/FinalCTA";
import { HowItWorks } from "@/components/HowItWorks";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProductReveal } from "@/components/ProductReveal";
import { ReducedMotionFallback } from "@/components/ReducedMotionFallback";
import { ScrollCanvas } from "@/components/ScrollCanvas";
import { StoryOverlay } from "@/components/StoryOverlay";
import { WaterFinale } from "@/components/WaterFinale";
import {
  benefits,
  deviceLayers,
  hasPurchaseAction,
  product,
  scenes,
  scrollViewports,
  sequence,
  siteName,
  timelineLength,
  type ScrollRange,
} from "@/config/content";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFrameSequence } from "@/hooks/useFrameSequence";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const { opening, source, origin, descent, device, howItWorks, finale, cta } = scenes;

/**
 * How many rAF ticks the draw loop coasts for after the picture has caught up
 * with the timeline before it stands down. At 60Hz this is half a second, which
 * comfortably outlasts the 0.6s scrub ease.
 */
const IDLE_FRAMES_BEFORE_STANDDOWN = 40;

/**
 * What an inactive layer of the cutaway drops to while another one is lit. Not
 * zero: the visitor has to keep seeing the whole stack to understand where in it
 * they are — the dim layers are the context that makes the bright one mean
 * something.
 */
const LAYER_DIM = 0.2;

type RevealOptions = {
  /** Distance the layer travels up into place. */
  y?: number;
  /** Distance it drifts further up as it leaves. */
  exitY?: number;
  /** 0 disables the blur transition entirely (mobile). */
  blur?: number;
  scale?: number;
};

/**
 * Adds a fade-in / hold / fade-out pair to the master timeline. Timeline units
 * are the units in content.ts, so a range of 15–35 is literally that slice of
 * the pin.
 */
function reveal(
  timeline: gsap.core.Timeline,
  target: Element | null,
  range: ScrollRange,
  { y = 36, exitY = 28, blur = 10, scale = 0.985 }: RevealOptions = {},
) {
  if (!target) return;

  const blurred = blur > 0 ? { filter: `blur(${blur}px)` } : {};
  const sharp = blur > 0 ? { filter: "blur(0px)" } : {};

  const inDuration = range.inEnd - range.inStart;
  if (inDuration > 0) {
    timeline.fromTo(
      target,
      { autoAlpha: 0, y, scale, ...blurred },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        ...sharp,
        duration: inDuration,
        ease: "power2.out",
      },
      range.inStart,
    );
  } else {
    // Scene 1 is already on screen at scroll position zero.
    timeline.set(target, { autoAlpha: 1, y: 0, scale: 1, ...sharp }, range.inStart);
  }

  const outDuration = range.outEnd - range.outStart;
  if (outDuration > 0) {
    timeline.to(
      target,
      {
        autoAlpha: 0,
        y: -exitY,
        ...(blur > 0 ? { filter: `blur(${blur * 0.8}px)` } : {}),
        duration: outDuration,
        ease: "power2.in",
      },
      range.outStart,
    );
  }
}

export function GlacierExperience() {
  const mode = useExperienceMode();

  const [loaderMounted, setLoaderMounted] = useState(true);

  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * The frame sequence: loads its opening frames, reports ready, and streams the
   * rest in behind the live page. `draw` paints a frame into the canvas and is
   * safe to call on every rAF tick — it is a no-op when the frame has not changed,
   * and it never touches React state.
   */
  const {
    status,
    progress: loadProgress,
    draw,
  } = useFrameSequence({ enabled: mode === "scrub", canvasRef });

  const openingRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const descentRef = useRef<HTMLDivElement>(null);

  // Scene 5 — the device, from outside.
  const deviceLayerRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const deviceBackdropRef = useRef<HTMLDivElement>(null);
  const deviceGlowRef = useRef<HTMLDivElement>(null);
  const deviceSweepRef = useRef<HTMLDivElement>(null);
  const deviceMistRef = useRef<HTMLDivElement>(null);
  const deviceReflectionRef = useRef<HTMLDivElement>(null);
  const deviceIntroRef = useRef<HTMLDivElement>(null);

  // Scene 6 — the cutaway and the nine-layer walk.
  const hiwRef = useRef<HTMLDivElement>(null);
  const hiwBackdropRef = useRef<HTMLDivElement>(null);
  const hiwCutawayRef = useRef<HTMLDivElement>(null);
  const hiwWaterRef = useRef<HTMLDivElement>(null);
  const hiwHeadingRef = useRef<HTMLDivElement>(null);
  const hiwNoteRef = useRef<HTMLParagraphElement>(null);
  const hiwCalloutRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scene 7 — benefits. Empty until they are verified.
  const benefitRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scene 8 — the pour.
  const finaleRef = useRef<HTMLDivElement>(null);
  const finaleBackdropRef = useRef<HTMLDivElement>(null);
  const finaleDeviceRef = useRef<HTMLDivElement>(null);
  const finalePourRef = useRef<HTMLDivElement>(null);
  const finaleGlassRef = useRef<HTMLDivElement>(null);
  const finaleCopyRef = useRef<HTMLDivElement>(null);

  const ctaRef = useRef<HTMLElement>(null);

  /* ------------------------------------------------------------------ *
   * The pinned, scrubbed master timeline.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (mode !== "scrub" || status !== "ready") return;

    const stage = stageRef.current;
    if (!stage) return;

    const media = gsap.matchMedia();

    media.add(
      {
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)",
      },
      (self) => {
        const isDesktop = Boolean(self.conditions?.isDesktop);

        // Mobile skips the blur transitions entirely: a full-screen backdrop-blur
        // on a phone costs more than every other effect on this page put together.
        const blur = isDesktop ? 10 : 0;
        const viewports = isDesktop
          ? scrollViewports.desktop
          : scrollViewports.mobile;

        const timeline = gsap.timeline({ defaults: { ease: "none" } });

        /* ---------------------------------------------------------------- *
         * Act I — the glacier.
         * ---------------------------------------------------------------- */
        reveal(timeline, openingRef.current, opening.range, { blur, exitY: 40 });
        reveal(timeline, sourceRef.current, source.range, { blur });
        reveal(timeline, originRef.current, origin.range, { blur });
        reveal(timeline, descentRef.current, descent.range, { blur });

        /* ---------------------------------------------------------------- *
         * Act II — the device, from outside.
         *
         * The layer itself only fades. Everything that reads as depth is a
         * separate transform on a separate element, so the browser can hand the
         * whole scene to the compositor: nothing here animates a layout
         * property, and nothing here runs when the scene is off screen.
         * ---------------------------------------------------------------- */
        reveal(timeline, deviceLayerRef.current, device.range, {
          blur: 0,
          y: 0,
          scale: 1,
          exitY: 0,
        });

        const enterAt = device.range.inStart;
        const settledAt = device.range.inEnd;
        const enterDuration = settledAt - enterAt;
        const holdDuration = device.range.outStart - settledAt;
        const exitDuration = device.range.outEnd - device.range.outStart;

        if (deviceBackdropRef.current) {
          timeline.fromTo(
            deviceBackdropRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: enterDuration * 0.7, ease: "power1.out" },
            enterAt,
          );
        }

        if (deviceRef.current) {
          // Rises, settles, and turns a few degrees. A flat PNG has no back and
          // no sides, so the tilt is kept small enough that it reads as parallax
          // rather than as rotation — a real turntable needs real geometry.
          timeline.fromTo(
            deviceRef.current,
            {
              autoAlpha: 0.15,
              scale: 0.78,
              y: isDesktop ? 90 : 56,
              rotateX: 9,
              rotateY: -3,
              ...(blur > 0 ? { filter: "blur(16px)" } : {}),
            },
            {
              autoAlpha: 1,
              scale: 1,
              y: 0,
              rotateX: 0,
              rotateY: -1.2,
              ...(blur > 0 ? { filter: "blur(0px)" } : {}),
              duration: enterDuration,
              ease: "power2.out",
            },
            enterAt,
          );

          // The hold: a slow drift against the still-moving glacier behind it.
          timeline.to(
            deviceRef.current,
            {
              y: isDesktop ? -26 : -14,
              rotateY: 2.4,
              scale: 1.03,
              duration: holdDuration,
              ease: "none",
            },
            settledAt,
          );

          // The exit is the transition into the cutaway: the device does not
          // shrink away, it comes *at* the camera and dissolves, so the cutaway
          // rising behind it reads as the inside of the thing we just went into.
          timeline.to(
            deviceRef.current,
            {
              scale: 1.45,
              ...(blur > 0 ? { filter: "blur(12px)" } : {}),
              duration: exitDuration,
              ease: "power2.in",
            },
            device.range.outStart,
          );
        }

        if (deviceGlowRef.current) {
          timeline.fromTo(
            deviceGlowRef.current,
            { autoAlpha: 0, scale: 0.7 },
            { autoAlpha: 1, scale: 1, duration: enterDuration * 0.8, ease: "power1.out" },
            enterAt + 2,
          );
        }

        if (deviceSweepRef.current) {
          // One pass of light across the copper as it settles. The bar is masked
          // to the device's own silhouette, and clipped, so it needs no fade —
          // off the edge of the device is simply off.
          timeline.set(deviceSweepRef.current, { autoAlpha: 1 }, enterAt);
          timeline.fromTo(
            deviceSweepRef.current,
            { xPercent: -160 },
            { xPercent: 200, duration: enterDuration + 2, ease: "none" },
            enterAt + 2,
          );
        }

        // Reflection and mist are the two cheapest things to lose, so a phone
        // never renders them at all.
        if (isDesktop && deviceReflectionRef.current) {
          timeline.fromTo(
            deviceReflectionRef.current,
            { autoAlpha: 0, y: -16 },
            { autoAlpha: 0.22, y: 0, duration: enterDuration * 0.7, ease: "power1.out" },
            enterAt + 3,
          );
        }

        if (isDesktop && deviceMistRef.current) {
          timeline.fromTo(
            deviceMistRef.current,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: enterDuration * 0.8, ease: "power1.out" },
            enterAt + 2,
          );
          timeline.to(
            deviceMistRef.current,
            { y: -30, autoAlpha: 0.5, duration: holdDuration, ease: "none" },
            settledAt,
          );
        }

        reveal(timeline, deviceIntroRef.current, device.intro.range, {
          blur: blur > 0 ? 6 : 0,
          y: 26,
          exitY: 20,
        });

        /* ---------------------------------------------------------------- *
         * Act III — how the device works.
         *
         * The cutaway grows out of the device that just dissolved, then the walk
         * lights one material at a time while the water runs down past them.
         *
         * Every beat below is a tween on this one scrubbed timeline, which is
         * what makes reverse scrolling free: there is no state machine listening
         * for a scroll direction, no "current layer" in React, and nothing to
         * get stuck. At any scroll position the entire picture — which layer is
         * lit, how far the water has fallen, which words are on screen — is a
         * pure function of the timeline's progress.
         * ---------------------------------------------------------------- */
        reveal(timeline, hiwRef.current, howItWorks.range, {
          blur: 0,
          y: 0,
          scale: 1,
          exitY: 0,
        });

        const walk = howItWorks.walk;
        const hiwIn = howItWorks.range.inEnd - howItWorks.range.inStart;

        if (hiwBackdropRef.current) {
          timeline.fromTo(
            hiwBackdropRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: hiwIn * 0.8, ease: "power1.out" },
            howItWorks.range.inStart,
          );
        }

        if (hiwCutawayRef.current) {
          timeline.fromTo(
            hiwCutawayRef.current,
            { autoAlpha: 0, scale: 0.82, rotateX: 8 },
            {
              autoAlpha: 1,
              scale: 1,
              rotateX: 0,
              duration: hiwIn,
              ease: "power2.out",
            },
            howItWorks.range.inStart,
          );
        }

        // On a phone the heading sits above a cutaway that has been pulled up to
        // make room for the callouts below it — there is no left column to park
        // it in, so it leaves before the walk starts rather than fighting for the
        // same air.
        const headingRange: ScrollRange = isDesktop
          ? howItWorks.headingRange
          : {
              ...howItWorks.headingRange,
              outStart: walk.start - 3,
              outEnd: walk.start - 0.5,
            };

        reveal(timeline, hiwHeadingRef.current, headingRange, {
          blur: blur > 0 ? 6 : 0,
          y: 24,
          exitY: 18,
        });

        reveal(timeline, hiwNoteRef.current, howItWorks.range, {
          blur: 0,
          y: 12,
          exitY: 8,
          scale: 1,
        });

        /* ------------------------- The layer walk ------------------------- */
        const cutaway = hiwCutawayRef.current;

        if (cutaway) {
          const allLayers = cutaway.querySelectorAll("[data-layer]");

          // Everything drops to the base dim just before the first layer lights.
          timeline.to(
            allLayers,
            { opacity: LAYER_DIM, duration: 2, ease: "power2.inOut" },
            walk.start - 2,
          );

          deviceLayers.forEach((layer, index) => {
            const group = cutaway.querySelector(`[data-layer="${layer.id}"]`);
            const halo = cutaway.querySelector(`[data-halo="${layer.id}"]`);
            const anchor = cutaway.querySelector(`[data-anchor="${layer.id}"]`);
            const callout = hiwCalloutRefs.current[index];

            const { start, end } = layer.scrollRange;
            const fade = (end - start) / 3;
            const isLast = index === deviceLayers.length - 1;

            if (group) {
              timeline.fromTo(
                group,
                { opacity: LAYER_DIM },
                { opacity: 1, duration: fade, ease: "power2.out" },
                start,
              );
              // The last one is left lit: the closing beat below brings the whole
              // stack back up, and dimming it first would read as a flicker.
              if (!isLast) {
                timeline.to(
                  group,
                  { opacity: LAYER_DIM, duration: fade, ease: "power2.in" },
                  end - fade,
                );
              }
            }

            if (halo) {
              timeline.fromTo(
                halo,
                { opacity: 0 },
                { opacity: 1, duration: fade, ease: "power2.out" },
                start,
              );
              timeline.to(
                halo,
                { opacity: 0, duration: fade, ease: "power2.in" },
                end - fade,
              );
            }

            // The dot the connector line lands on.
            if (anchor) {
              timeline.fromTo(
                anchor,
                { opacity: 0 },
                { opacity: 1, duration: fade, ease: "power2.out" },
                start,
              );
              timeline.to(
                anchor,
                { opacity: 0, duration: fade, ease: "power2.in" },
                end - fade,
              );
            }

            reveal(
              timeline,
              callout,
              { inStart: start, inEnd: start + fade, outStart: end - fade, outEnd: end },
              { blur: 0, y: 14, exitY: 12, scale: 1 },
            );
          });

          // The water has reached the outlet: the whole stack comes back up.
          timeline.to(
            allLayers,
            { opacity: 1, duration: 3, ease: "power2.out" },
            walk.end,
          );
        }

        /* --------------------------- The water ---------------------------- */
        // One transform, running the length of the walk, so the front arrives at
        // each layer as that layer lights up — and runs back up the column,
        // exactly, when the visitor scrolls back.
        const water = hiwWaterRef.current;

        if (water) {
          const walkSpan = walk.end - walk.start;

          timeline.fromTo(
            water.querySelectorAll("[data-stream]"),
            { yPercent: -100 },
            { yPercent: 0, duration: walkSpan, ease: "none" },
            walk.start,
          );

          // Droplets trail the front rather than leading it: the stagger delays
          // each one's start, so they arrive behind the surface, not ahead of it.
          const drops = water.querySelectorAll("[data-droplet]");
          if (isDesktop && drops.length > 0) {
            timeline.fromTo(
              drops,
              { yPercent: -100, autoAlpha: 0 },
              {
                yPercent: 0,
                autoAlpha: 1,
                duration: walkSpan * 0.72,
                ease: "none",
                stagger: { each: walkSpan * 0.09 },
              },
              walk.start,
            );
          }
        }

        /* ---------------------------------------------------------------- *
         * Act IV — benefits. Nothing renders while they are unverified, and the
         * loop below simply does not run.
         * ---------------------------------------------------------------- */
        benefits.forEach((benefit, index) => {
          reveal(timeline, benefitRefs.current[index], benefit.range, {
            blur: blur > 0 ? 8 : 0,
            y: 30,
            exitY: 24,
          });
        });

        /* ---------------------------------------------------------------- *
         * Act V — the pour.
         * ---------------------------------------------------------------- */
        reveal(timeline, finaleRef.current, finale.range, {
          blur: 0,
          y: 0,
          scale: 1,
          exitY: 0,
        });

        if (finaleBackdropRef.current) {
          timeline.fromTo(
            finaleBackdropRef.current,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: (finale.range.inEnd - finale.range.inStart) * 0.8,
              ease: "power1.out",
            },
            finale.range.inStart,
          );
        }

        if (finaleDeviceRef.current) {
          timeline.fromTo(
            finaleDeviceRef.current,
            { autoAlpha: 0, y: 34, scale: 0.94 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: finale.range.inEnd - finale.range.inStart,
              ease: "power2.out",
            },
            finale.range.inStart,
          );
        }

        // The pour starts as the device settles and runs until the scene leaves.
        const pourStart = finale.range.inEnd - 1;
        const pourSpan = finale.range.outStart - pourStart;

        if (finalePourRef.current) {
          timeline.fromTo(
            finalePourRef.current.querySelectorAll("[data-stream]"),
            { yPercent: -100 },
            { yPercent: 0, duration: pourSpan * 0.45, ease: "power1.in" },
            pourStart,
          );
        }

        const glassFill =
          finaleGlassRef.current?.querySelector("[data-glass-fill]") ?? null;

        if (glassFill) {
          timeline.fromTo(
            glassFill,
            { scaleY: 0 },
            {
              scaleY: 0.72,
              // In viewBox units. A percentage transform-origin on an SVG element
              // is not interpreted the same way by every engine; this is.
              svgOrigin: "60 132",
              duration: pourSpan * 0.75,
              ease: "power1.out",
            },
            // Begins once the stream has actually reached the rim.
            pourStart + pourSpan * 0.3,
          );
        }

        reveal(timeline, finaleCopyRef.current, finale.range, {
          blur: blur > 0 ? 6 : 0,
          y: 26,
          exitY: 20,
        });

        /* ---------------------------------------------------------------- *
         * Act VI — the call to action. Fades in and stays: it is the last thing
         * on the page.
         * ---------------------------------------------------------------- */
        reveal(timeline, ctaRef.current, cta.range, { blur: 0, y: 30, exitY: 0 });

        // Hold the timeline open to its full declared length, whatever the scenes
        // above happen to add up to, so one timeline unit is always the same
        // amount of scroll.
        timeline.to({}, { duration: timelineLength }, 0);

        /* -------------------------------------------------------------- *
         * Paint the canvas from the timeline.
         *
         * This runs on rAF rather than inside ScrollTrigger's `onUpdate`, which
         * fires per scroll event: a trackpad or a fast wheel can emit several of
         * those per displayed frame, and every one of them would be a wasted
         * `drawImage`. Throttling to rAF means exactly one paint per frame the
         * screen actually shows, and it means React never sees the scroll at all.
         *
         * The loop is NOT stopped when the pin goes inactive: `scrub` keeps easing
         * the timeline for up to another 0.6s after the last scroll, and cutting
         * the loop at that moment would freeze the picture short of where the
         * visitor let go. It retires itself once the picture has caught up with
         * the timeline instead, and any scroll wakes it again.
         *
         * Reverse scrolling needs no special handling whatsoever: the frame index
         * is a pure function of the timeline's progress, so running the scroll
         * backwards simply asks for lower indices — all of them already decoded.
         * -------------------------------------------------------------- */
        let rafId: number | null = null;
        let idleFrames = 0;

        /**
         * The footage is mapped onto the glacier act alone, not the whole pin: it
         * reaches its final frame exactly as the device arrives and holds there,
         * behind an all-but-opaque backdrop, for the rest of the scroll. Stretched
         * across the full timeline it would crawl, and most of its paints would
         * land where nobody can see them.
         */
        const glacierProgress = sequence.end / timelineLength;

        const renderFrame = () => {
          rafId = requestAnimationFrame(renderFrame);

          // Read the *timeline's* progress rather than the raw scroll position, so
          // the picture and the copy share one eased scrub and never drift apart.
          const painted = draw(Math.min(1, timeline.progress() / glacierProgress));

          if (painted) {
            idleFrames = 0;
            return;
          }

          // Nothing new to paint. Coast a little — the scrub ease is still
          // running — then stand down and give the frame budget back.
          if (++idleFrames > IDLE_FRAMES_BEFORE_STANDDOWN) stopLoop();
        };

        const startLoop = () => {
          idleFrames = 0;
          if (rafId === null) rafId = requestAnimationFrame(renderFrame);
        };

        const stopLoop = () => {
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = null;
        };

        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          // The pin is as long as the timeline says it is, so adding a verified
          // benefit lengthens the page instead of speeding everything else up.
          end: () =>
            `+=${window.innerHeight * viewports * (timelineLength / 100)}`,
          pin: stage,
          pinSpacing: true,
          anticipatePin: 1,
          animation: timeline,
          scrub: isDesktop ? 0.6 : 0.35,
          invalidateOnRefresh: true,
          onUpdate: startLoop,
          onToggle: startLoop,
        });

        // Paint the opening frame before the loader lifts, so the reveal never
        // uncovers an empty canvas.
        startLoop();

        // matchMedia reverts the timeline and the ScrollTrigger for us; the rAF
        // loop is ours to clean up.
        return () => stopLoop();
      },
    );

    return () => media.revert();
  }, [mode, status, draw]);

  /* ------------------------------------------------------------------ *
   * Opening titles: a one-shot entrance once the loader clears.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (mode !== "scrub" || status !== "ready") return;
    const layer = openingRef.current;
    if (!layer) return;

    const context = gsap.context(() => {
      gsap.from("[data-intro]", {
        autoAlpha: 0,
        y: 24,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.35,
      });
    }, layer);

    return () => context.revert();
  }, [mode, status]);

  /* Unmount the loader once its fade-out has finished. */
  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setTimeout(() => setLoaderMounted(false), 800);
    return () => window.clearTimeout(timer);
  }, [status]);

  /** Keyboard users should not have to scroll 1,100vh to reach the end. */
  const skipToEnd = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    window.setTimeout(() => {
      // The buy button only exists once a buy URL is configured; the section
      // itself is always there and is focusable, so it is the reliable target.
      const target =
        document.getElementById("buy-now") ?? document.getElementById("purchase");
      target?.focus();
    }, 150);
  }, []);

  if (mode === "reduced") return <ReducedMotionFallback background="poster" />;
  if (mode === "lite") return <ReducedMotionFallback background="loop" />;
  if (status === "error") return <ReducedMotionFallback background="poster" />;

  return (
    <>
      {loaderMounted && (
        <LoadingScreen progress={loadProgress} hidden={status === "ready"} />
      )}

      <button
        type="button"
        onClick={skipToEnd}
        className="sr-only rounded-full bg-ice px-5 py-3 text-sm font-medium text-navy-900 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
      >
        {hasPurchaseAction ? "Skip to purchase options" : "Skip to the end"}
      </button>

      <main>
        <h1 className="sr-only">
          {siteName} — {opening.headline}
        </h1>

        <section
          ref={stageRef}
          aria-label="The story of the water, told as you scroll"
          className="relative h-screen w-full overflow-hidden bg-navy-900"
        >
          {/* Mounted only once the mode is known, so a reduced-motion or
              low-power visitor never starts downloading a single frame. */}
          {mode === "scrub" && <ScrollCanvas canvasRef={canvasRef} />}

          {/* Scene 1 — the summit. */}
          <StoryOverlay ref={openingRef}>
            <div className="flex flex-col items-center">
              {/* No logo: the only wordmark we have still reads "Himalaya
                  Sparsh", which is not the confirmed brand. The descriptor is
                  accurate and says what the product actually is. */}
              <p
                data-intro
                className="font-mono text-[0.7rem] tracking-[0.4em] text-glacier-300 uppercase"
              >
                {product.descriptor}
              </p>
              <p
                data-intro
                className="mt-8 max-w-3xl font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-6xl md:text-7xl"
              >
                {opening.headline}
              </p>
              <p
                data-intro
                className="mt-8 font-mono text-[0.7rem] tracking-[0.35em] text-silver-dim uppercase"
              >
                {opening.instruction}
              </p>
              <span
                data-intro
                aria-hidden="true"
                className="mt-6 flex h-11 w-6 justify-center overflow-hidden rounded-full border border-white/25"
              >
                <span className="animate-scroll-cue mt-2 block h-2 w-px bg-glacier-100" />
              </span>
            </div>
          </StoryOverlay>

          {/* Scene 2 — the glacier and the water source. */}
          <StoryOverlay ref={sourceRef}>
            <div className="max-w-2xl">
              <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
                {source.eyebrow}
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-7xl">
                {source.heading}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
                {source.body}
              </p>
            </div>
          </StoryOverlay>

          {/* Scene 3 — Gonbo Rangjon. */}
          <StoryOverlay ref={originRef}>
            <div className="max-w-2xl">
              <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
                {origin.eyebrow}
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
                {origin.heading}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
                {origin.body}
              </p>
            </div>
          </StoryOverlay>

          {/* Scene 4 — the water turns toward the device. */}
          <StoryOverlay ref={descentRef}>
            <div className="max-w-2xl">
              <p className="font-mono text-[0.7rem] tracking-[0.35em] text-glacier-300 uppercase">
                {descent.eyebrow}
              </p>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] font-light text-balance text-ice sm:text-5xl md:text-6xl">
                {descent.heading}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty text-silver md:text-lg">
                {descent.body}
              </p>
            </div>
          </StoryOverlay>

          {/* Scene 5 — the device, from outside. */}
          <ProductReveal
            ref={deviceLayerRef}
            deviceRef={deviceRef}
            backdropRef={deviceBackdropRef}
            glowRef={deviceGlowRef}
            sweepRef={deviceSweepRef}
            mistRef={deviceMistRef}
            reflectionRef={deviceReflectionRef}
            introRef={deviceIntroRef}
          />

          {/* Scene 6 — inside it. */}
          <HowItWorks
            ref={hiwRef}
            backdropRef={hiwBackdropRef}
            cutawayRef={hiwCutawayRef}
            waterRef={hiwWaterRef}
            headingRef={hiwHeadingRef}
            noteRef={hiwNoteRef}
            calloutRefs={hiwCalloutRefs}
          />

          {/* Scene 7 — benefits. Renders nothing until they are verified. */}
          <BenefitsSequence cardRefs={benefitRefs} />

          {/* Scene 8 — the pour. */}
          <WaterFinale
            ref={finaleRef}
            backdropRef={finaleBackdropRef}
            deviceRef={finaleDeviceRef}
            pourRef={finalePourRef}
            glassRef={finaleGlassRef}
            copyRef={finaleCopyRef}
          />

          {/* Scene 9 — enquiry / purchase. */}
          <FinalCTA ref={ctaRef} variant="overlay" />
        </section>
      </main>
    </>
  );
}
