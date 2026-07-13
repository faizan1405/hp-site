"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { type FrameSet, frames } from "@/config/content";
import { FrameSequenceLoader } from "@/lib/frameSequence";

/** Give up on the sequence after this long and fall back to the poster. */
const PRIORITY_TIMEOUT_MS = 15_000;

/**
 * Retina is not worth 4× the fill rate for a full-screen photographic backdrop
 * that is already softened by two gradient scrims and a grain overlay — and on a
 * 3× phone it is the difference between a smooth scrub and a slideshow.
 */
const MAX_DEVICE_PIXEL_RATIO = 2;

/** Matches the `isDesktop` / `isMobile` split in GlacierExperience's matchMedia. */
const MOBILE_QUERY = "(max-width: 767px)";

export type FrameSequenceStatus = "loading" | "ready" | "error";

type Options = {
  /** False for reduced-motion and lite mode: not one byte is fetched. */
  enabled: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

type Result = {
  status: FrameSequenceStatus;
  /** 0–100, priority head only. Drives the loading screen. */
  progress: number;
  /** The set actually in use, so the canvas can reserve the right aspect. */
  set: FrameSet;
  /**
   * Paint the frame at `t` (0–1). Stable identity, safe to call every rAF tick.
   * Returns true when it actually painted something new, which is how the caller
   * knows the scrub has caught up and the loop can stand down.
   */
  draw: (t: number) => boolean;
};

/** Chosen once, at mount: swapping sets mid-session would re-download everything. */
function pickSet(): FrameSet {
  if (typeof window === "undefined") return frames.desktop;
  return window.matchMedia(MOBILE_QUERY).matches ? frames.mobile : frames.desktop;
}

export function useFrameSequence({ enabled, canvasRef }: Options): Result {
  const [status, setStatus] = useState<FrameSequenceStatus>("loading");
  const [progress, setProgress] = useState(0);
  const [set] = useState<FrameSet>(pickSet);

  const loaderRef = useRef<FrameSequenceLoader | null>(null);

  // Everything the draw path touches lives in a ref. A single `setState` in here
  // would re-render the entire scene tree sixty times a second.
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastIndexRef = useRef(-1);
  const lastImageRef = useRef<HTMLImageElement | null>(null);
  const dirtyRef = useRef(true);

  /* ------------------------------------------------------------------ *
   * Painting.
   * ------------------------------------------------------------------ */

  /** Draws `image` over the whole canvas with `object-fit: cover` semantics. */
  const paint = useCallback(
    (image: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Cached: `getContext` is not free, and this runs on every animation frame.
      // `alpha: false` is what lets the compositor skip blending the backdrop —
      // it is opaque by definition, and it only takes effect on the first call.
      const context =
        contextRef.current ??
        (contextRef.current = canvas.getContext("2d", { alpha: false }));
      if (!context) return;

      const { width: cw, height: ch } = canvas;
      if (cw === 0 || ch === 0) return;

      const scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;

      context.drawImage(image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

      lastImageRef.current = image;
      dirtyRef.current = false;
    },
    [canvasRef],
  );

  const draw = useCallback(
    (t: number): boolean => {
      const loader = loaderRef.current;
      if (!loader) return false;

      const index = Math.min(
        set.count - 1,
        Math.max(0, Math.round(t * (set.count - 1))),
      );

      // Nothing moved and nothing invalidated the canvas: skip the whole paint.
      if (index === lastIndexRef.current && !dirtyRef.current) return false;

      lastIndexRef.current = index;
      loader.setPlayhead(index);

      const image = loader.nearest(index);
      if (!image) return false;

      // The exact frame has not arrived, and the neighbour standing in for it is
      // already on screen. Repainting it would be a no-op — but stay dirty, so the
      // real frame gets painted the moment it lands.
      if (image === lastImageRef.current && !dirtyRef.current) return false;

      paint(image);
      return true;
    },
    [paint, set.count],
  );

  /* ------------------------------------------------------------------ *
   * Loading.
   * ------------------------------------------------------------------ */

  useEffect(() => {
    if (!enabled) return;

    let settled = false;

    const loader = new FrameSequenceLoader(set, {
      onProgress: (fraction) => {
        // Capped below 100: the last stretch belongs to the reveal, not the fetch.
        setProgress((current) => Math.max(current, Math.min(99, fraction * 100)));
      },

      onReady: () => {
        if (settled) return;
        settled = true;
        setProgress(100);
        setStatus("ready");
      },

      onError: (reason) => {
        if (settled) return;
        settled = true;
        console.error(
          `[useFrameSequence] ${reason} Falling back to the poster image.`,
        );
        setStatus("error");
      },

      onFrameLoaded: (index) => {
        // The frame the scrubber is sitting on just arrived, and it is currently
        // being approximated by a neighbour. Swap it in — without this, a frame
        // that lands after the rAF loop has stood down would never be shown.
        if (index !== lastIndexRef.current) return;
        const image = loader.nearest(index);
        if (image && image !== lastImageRef.current) paint(image);
      },
    });

    loaderRef.current = loader;
    void loader.start();

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      console.error(
        "[useFrameSequence] The opening frames did not arrive in time. " +
          "Falling back to the poster image.",
      );
      setStatus("error");
    }, PRIORITY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
      loader.destroy();
      loaderRef.current = null;
      // The canvas may be torn down with us (a fallback replaces the whole tree),
      // so drop the cached context too rather than holding one for a detached node.
      contextRef.current = null;
      lastIndexRef.current = -1;
      lastImageRef.current = null;
      dirtyRef.current = true;
    };
  }, [enabled, set, paint]);

  /* ------------------------------------------------------------------ *
   * Sizing. The canvas backing store must track its CSS box, or the picture
   * stretches — and it must do so in device pixels, or it looks like a JPEG from
   * 2004.
   * ------------------------------------------------------------------ */

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const boxWidth = canvas.clientWidth * ratio;
      const boxHeight = canvas.clientHeight * ratio;
      if (boxWidth === 0 || boxHeight === 0) return;

      /**
       * Never allocate more canvas pixels than the frame can actually fill.
       *
       * The frames are 720p. A 1440×900 backing store would make every single
       * `drawImage` a 1.25× *upscale* — the browser inventing pixels that carry no
       * detail the source ever had, 60 times a second. Shrinking the backing store
       * until the cover-scale is exactly 1 turns the paint into a straight 1:1
       * blit and lets the compositor do the upscale instead, which is a free GPU
       * stretch of the finished canvas rather than a per-frame CPU resample.
       *
       * It cannot cost quality: the visible crop and the source detail behind it
       * are identical either way. The only thing that changes is *where* the
       * interpolation happens. On a tall phone, where the cover-scale is nearly 4×,
       * this cuts the pixels touched per frame by more than an order of magnitude.
       */
      const cover = Math.max(boxWidth / set.width, boxHeight / set.height);
      const shrink = cover > 1 ? 1 / cover : 1;

      const width = Math.round(boxWidth * shrink);
      const height = Math.round(boxHeight * shrink);
      if (width === 0 || height === 0) return;
      if (canvas.width === width && canvas.height === height) return;

      // Assigning either dimension clears the canvas, so the current frame has to
      // go back down before the next paint would otherwise have run.
      canvas.width = width;
      canvas.height = height;
      dirtyRef.current = true;

      const image = lastImageRef.current;
      if (image) paint(image);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [enabled, canvasRef, paint, set.width, set.height]);

  return { status, progress, set, draw };
}
