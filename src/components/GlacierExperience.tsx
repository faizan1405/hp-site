"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { BenefitCard } from "@/components/BenefitCard";
import { FinalCTA } from "@/components/FinalCTA";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProductReveal } from "@/components/ProductReveal";
import { ReducedMotionFallback } from "@/components/ReducedMotionFallback";
import { ScrollCanvas } from "@/components/ScrollCanvas";
import { StoryOverlay } from "@/components/StoryOverlay";
import {
  activeDeviceElements,
  hasPurchaseAction,
  product,
  scenes,
  siteName,
  type ScrollRange,
} from "@/config/content";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFrameSequence } from "@/hooks/useFrameSequence";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const { opening, source, origin, descent, device, benefits, cta } = scenes;

/**
 * Extra scroll beyond the first viewport, in multiples of the viewport height.
 * The pin spacer turns these into a ~600vh (desktop) / ~450vh (mobile) page.
 */
const SCROLL_VIEWPORTS = { desktop: 5, mobile: 3.5 } as const;

/**
 * How many rAF ticks the draw loop coasts for after the picture has caught up
 * with the timeline before it stands down. At 60Hz this is half a second, which
 * comfortably outlasts the 0.6s scrub ease.
 */
const IDLE_FRAMES_BEFORE_STANDDOWN = 40;

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
 * are scroll percentages, so a range of 15–35 is literally 15%–35% of the pin.
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

  // Scene 5 — the device and everything layered around it.
  const deviceLayerRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const deviceBackdropRef = useRef<HTMLDivElement>(null);
  const deviceGlowRef = useRef<HTMLDivElement>(null);
  const deviceSweepRef = useRef<HTMLDivElement>(null);
  const deviceMistRef = useRef<HTMLDivElement>(null);
  const deviceReflectionRef = useRef<HTMLDivElement>(null);
  const deviceIntroRef = useRef<HTMLDivElement>(null);
  const deviceConversionRef = useRef<HTMLDivElement>(null);
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([]);

  const benefitRefs = useRef<(HTMLDivElement | null)[]>([]);
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
          ? SCROLL_VIEWPORTS.desktop
          : SCROLL_VIEWPORTS.mobile;

        const timeline = gsap.timeline({ defaults: { ease: "none" } });

        reveal(timeline, openingRef.current, opening.range, { blur, exitY: 40 });
        reveal(timeline, sourceRef.current, source.range, { blur });
        reveal(timeline, originRef.current, origin.range, { blur });
        reveal(timeline, descentRef.current, descent.range, { blur });

        /* ---------------------------------------------------------------- *
         * Scene 5 — the device.
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
          exitY: 24,
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
            {
              autoAlpha: 1,
              duration: enterDuration * 0.7,
              ease: "power1.out",
            },
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
          // This is the parallax, and the only motion while the copy changes.
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

          timeline.to(
            deviceRef.current,
            { scale: 0.985, duration: exitDuration, ease: "power2.in" },
            device.range.outStart,
          );
        }

        if (deviceGlowRef.current) {
          timeline.fromTo(
            deviceGlowRef.current,
            { autoAlpha: 0, scale: 0.7 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: enterDuration * 0.8,
              ease: "power1.out",
            },
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
            {
              xPercent: 200,
              duration: enterDuration + 2,
              ease: "none",
            },
            enterAt + 2,
          );
        }

        // Reflection and mist are the two cheapest things to lose, so a phone
        // never renders them at all.
        if (isDesktop && deviceReflectionRef.current) {
          timeline.fromTo(
            deviceReflectionRef.current,
            { autoAlpha: 0, y: -16 },
            {
              autoAlpha: 0.22,
              y: 0,
              duration: enterDuration * 0.7,
              ease: "power1.out",
            },
            enterAt + 3,
          );
        }

        if (isDesktop && deviceMistRef.current) {
          timeline.fromTo(
            deviceMistRef.current,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: enterDuration * 0.8,
              ease: "power1.out",
            },
            enterAt + 2,
          );
          timeline.to(
            deviceMistRef.current,
            { y: -30, autoAlpha: 0.5, duration: holdDuration, ease: "none" },
            settledAt,
          );
        }

        // The two copy blocks cross-fade in a shared grid cell beside the device.
        reveal(timeline, deviceIntroRef.current, device.intro.range, {
          blur: blur > 0 ? 6 : 0,
          y: 26,
          exitY: 20,
        });

        // On a phone the callouts sit *below* the device, which is exactly where
        // the conversion copy is. When stones are configured, pull that copy out
        // before the first one arrives so the two never share the space.
        const firstCallout = activeDeviceElements[0];
        const conversionRange: ScrollRange =
          !isDesktop && firstCallout
            ? {
                ...device.conversion.range,
                outStart: firstCallout.scrollRange.start - 3,
                outEnd: firstCallout.scrollRange.start,
              }
            : device.conversion.range;

        reveal(timeline, deviceConversionRef.current, conversionRange, {
          blur: blur > 0 ? 6 : 0,
          y: 26,
          exitY: 20,
        });

        // Stone callouts: one at a time, each inside its own window. Empty until
        // the client's verified list lands in content.ts.
        activeDeviceElements.forEach((element, index) => {
          const node = calloutRefs.current[index];
          if (!node) return;

          const { start, end } = element.scrollRange;
          const fade = Math.min(2, (end - start) / 3);

          reveal(
            timeline,
            node,
            { inStart: start, inEnd: start + fade, outStart: end - fade, outEnd: end },
            { blur: 0, y: 14, exitY: 12, scale: 1 },
          );
        });

        // Scene 6: one card at a time. Empty until the benefits are verified.
        benefits.forEach((benefit, index) => {
          reveal(timeline, benefitRefs.current[index], benefit.range, {
            blur: blur > 0 ? 8 : 0,
            y: 30,
            exitY: 24,
          });
        });

        // Scene 7: fades in and stays — it is the last thing on the page.
        reveal(timeline, ctaRef.current, cta.range, { blur: 0, y: 30, exitY: 0 });

        // Hold the timeline open to exactly 100 units so one unit is one percent
        // of the scroll, whatever the scenes above happen to add up to.
        timeline.to({}, { duration: 100 }, 0);

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

        const renderFrame = () => {
          rafId = requestAnimationFrame(renderFrame);

          // Read the *timeline's* progress rather than the raw scroll position, so
          // the picture and the copy share one eased scrub and never drift apart.
          const painted = draw(timeline.progress());

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
          end: () => `+=${window.innerHeight * viewports}`,
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

  /** Keyboard users should not have to scroll 600vh to reach the end. */
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

          {/* Scene 5 — the device. */}
          <ProductReveal
            ref={deviceLayerRef}
            deviceRef={deviceRef}
            backdropRef={deviceBackdropRef}
            glowRef={deviceGlowRef}
            sweepRef={deviceSweepRef}
            mistRef={deviceMistRef}
            reflectionRef={deviceReflectionRef}
            introRef={deviceIntroRef}
            conversionRef={deviceConversionRef}
            calloutRefs={calloutRefs}
          />

          {/* Scene 6 — benefits. Renders nothing until they are verified. */}
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={benefit.id}
              ref={(node) => {
                benefitRefs.current[index] = node;
              }}
              benefit={benefit}
              index={index}
              total={benefits.length}
            />
          ))}

          {/* Scene 7 — enquiry / purchase. */}
          <FinalCTA ref={ctaRef} variant="overlay" />
        </section>
      </main>
    </>
  );
}
