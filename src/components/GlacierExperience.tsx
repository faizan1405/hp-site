"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { BenefitCard } from "@/components/BenefitCard";
import { FinalCTA } from "@/components/FinalCTA";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProductReveal } from "@/components/ProductReveal";
import { ReducedMotionFallback } from "@/components/ReducedMotionFallback";
import { ScrollVideo } from "@/components/ScrollVideo";
import { StoryOverlay } from "@/components/StoryOverlay";
import {
  activeDeviceElements,
  assets,
  hasPurchaseAction,
  product,
  scenes,
  siteName,
  type ScrollRange,
} from "@/config/content";
import { useExperienceMode } from "@/hooks/useExperienceMode";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const { opening, source, origin, descent, device, benefits, cta } = scenes;

/** Give up on the video after this long and fall back to the poster. */
const METADATA_TIMEOUT_MS = 15_000;

/**
 * Extra scroll beyond the first viewport, in multiples of the viewport height.
 * The pin spacer turns these into a ~600vh (desktop) / ~450vh (mobile) page.
 */
const SCROLL_VIEWPORTS = { desktop: 5, mobile: 3.5 } as const;

type Status = "loading" | "ready" | "error";

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

  const [status, setStatus] = useState<Status>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaderMounted, setLoaderMounted] = useState(true);

  const stageRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Scrub state lives in refs: touching React state on every frame would
  // re-render the whole tree sixty times a second.
  const durationRef = useRef(0);
  const seekingRef = useRef(false);

  /* ------------------------------------------------------------------ *
   * Load the video far enough to know its duration.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (mode !== "scrub") return;
    const video = videoRef.current;
    if (!video) return;

    let settled = false;
    let creep = 0;

    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      console.error(
        `[GlacierExperience] ${reason} Falling back to the poster image.`,
        {
          src: assets.video,
          mediaError: video.error?.message ?? video.error?.code ?? null,
          networkState: video.networkState,
          readyState: video.readyState,
        },
      );
      setStatus("error");
    };

    const succeed = () => {
      if (settled) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      settled = true;
      durationRef.current = video.duration;
      video.pause();
      setLoadProgress(100);
      setStatus("ready");
      // The loader is coming down and the pin is about to mount: re-measure.
      ScrollTrigger.refresh();
    };

    const onDownloadProgress = () => {
      if (settled || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }
      const { buffered, duration } = video;
      if (buffered.length === 0) return;

      const fraction = buffered.end(buffered.length - 1) / duration;
      setLoadProgress((current) => Math.max(current, Math.min(96, fraction * 100)));
    };

    const onError = () => fail("The glacier video failed to load.");
    const onSeeking = () => {
      seekingRef.current = true;
    };
    const onSeeked = () => {
      seekingRef.current = false;
    };

    const sourceElement = video.querySelector("source");

    video.addEventListener("loadedmetadata", succeed);
    video.addEventListener("canplay", succeed);
    video.addEventListener("progress", onDownloadProgress);
    video.addEventListener("error", onError);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    // A missing file surfaces as an error on the <source>, not on the <video>.
    sourceElement?.addEventListener("error", onError);

    // Keep the bar moving before the first `progress` event arrives.
    const creepTimer = window.setInterval(() => {
      if (settled) return;
      creep = Math.min(creep + (90 - creep) * 0.08, 90);
      setLoadProgress((current) => Math.max(current, creep));
    }, 160);

    const timeoutTimer = window.setTimeout(
      () => fail("Video metadata did not arrive in time."),
      METADATA_TIMEOUT_MS,
    );

    // Served from cache: the events above may already have fired.
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) succeed();

    return () => {
      window.clearInterval(creepTimer);
      window.clearTimeout(timeoutTimer);
      video.removeEventListener("loadedmetadata", succeed);
      video.removeEventListener("canplay", succeed);
      video.removeEventListener("progress", onDownloadProgress);
      video.removeEventListener("error", onError);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      sourceElement?.removeEventListener("error", onError);
    };
  }, [mode]);

  /* ------------------------------------------------------------------ *
   * iOS refuses to buffer — and therefore to seek — a video that has never
   * been played. One play/pause on the first gesture unlocks it.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (mode !== "scrub" || status !== "ready") return;
    const video = videoRef.current;
    if (!video) return;

    const events = ["touchstart", "pointerdown", "wheel", "keydown"] as const;

    const unlock = () => {
      events.forEach((event) => window.removeEventListener(event, unlock));
      void Promise.resolve(video.play())
        .then(() => video.pause())
        .catch(() => {
          // Playback refused; desktop scrubbing works without the unlock anyway.
        });
    };

    events.forEach((event) =>
      window.addEventListener(event, unlock, { passive: true }),
    );

    return () => {
      events.forEach((event) => window.removeEventListener(event, unlock));
    };
  }, [mode, status]);

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

        // Mobile seeks less often and skips the blur transitions entirely.
        const seekThreshold = isDesktop ? 0.02 : 0.08;
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
         * Drive the video from the timeline. This runs on rAF rather than in
         * ScrollTrigger's onUpdate so the seek rate is capped at the display's
         * refresh rate.
         *
         * The loop is NOT stopped when the pin goes inactive: `scrub` keeps
         * easing the timeline for up to another 0.6s after the last scroll, and
         * cutting the loop at that moment would freeze the video short of the
         * end. Instead it retires itself once the picture has caught up with the
         * timeline, and any scroll wakes it again.
         * -------------------------------------------------------------- */
        let rafId: number | null = null;
        let settledFrames = 0;

        function seekVideo() {
          rafId = requestAnimationFrame(seekVideo);

          const video = videoRef.current;
          const duration = durationRef.current;
          if (!video || duration <= 0) return;

          // Let the pending seek land instead of queueing another one — this is
          // what stops a phone from drowning in decode work.
          if (seekingRef.current) return;

          // Read the *timeline's* progress rather than the raw scroll position,
          // so the video and the copy share one eased scrub and never drift apart.
          const target = gsap.utils.clamp(
            0,
            duration - 0.05,
            timeline.progress() * duration,
          );

          if (Math.abs(target - video.currentTime) < seekThreshold) {
            // Caught up. Idle for half a second, then stand down.
            if (++settledFrames > 30) stopLoop();
            return;
          }

          settledFrames = 0;
          video.currentTime = target;
        }

        const startLoop = () => {
          settledFrames = 0;
          if (rafId === null) rafId = requestAnimationFrame(seekVideo);
        };

        const stopLoop = () => {
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = null;
        };

        const trigger = ScrollTrigger.create({
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

        if (trigger.isActive) startLoop();

        // matchMedia reverts the timeline and the ScrollTrigger for us; the rAF
        // loop is ours to clean up.
        return () => stopLoop();
      },
    );

    return () => media.revert();
  }, [mode, status]);

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
              low-power visitor never starts downloading the video at all. */}
          {mode === "scrub" && <ScrollVideo videoRef={videoRef} />}

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
