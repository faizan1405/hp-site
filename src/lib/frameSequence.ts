import type { FrameSet } from "@/config/content";

/**
 * Loads a frame sequence for the scroll-scrubbed canvas.
 *
 * The contract this class exists to honour: **the site is never held hostage by
 * the frame set.** It loads a small priority head — enough to cover the opening
 * of the scroll — reports ready, and keeps a bounded window of decoded frames
 * around wherever the visitor currently is. A visitor who scrolls before a
 * frame has arrived sees the nearest frame that has actually decoded, never a
 * blank canvas and never a stall — and a visitor who scrolls far away has the
 * frames behind them evicted, so the sequence never holds more than a few dozen
 * decoded bitmaps at once regardless of how long it has been running.
 *
 * It is deliberately framework-free: no React, no state, no re-renders. The only
 * things that escape are the callbacks and `nearest()`.
 */

/** Frames are named `frame-0001.webp`, one-based, zero-padded to four digits. */
export function frameUrl(set: FrameSet, index: number): string {
  return `${set.path}/frame-${String(index + 1).padStart(4, "0")}.webp`;
}

/**
 * How much of the sequence must land before the loading screen lifts. Small on
 * purpose: it is the scroll runway, not the whole journey. Everything after it
 * arrives while the visitor is still reading scene one.
 */
export function priorityCount(set: FrameSet): number {
  return Math.min(15, Math.max(10, Math.ceil(set.count * 0.08)));
}

/**
 * How many decoded frames stay resident at once. A full sequence decoded at
 * once is real memory — 1280×720 alone is ~3.5MB of raw RGBA per frame, so all
 * 180 desktop frames held forever is the better part of 600MB — and none of it
 * buys anything once the visitor has scrolled away from it. This caps the
 * window to a slice proportional to the sequence's own length, so a fast
 * scroll always has its immediate neighbourhood ready without the whole set
 * ever being resident together.
 */
export function cacheSize(set: FrameSet): number {
  return Math.min(40, Math.max(20, Math.round(set.count * 0.2)));
}

/**
 * Parallel requests. Six is the classic per-host cap on HTTP/1.1 and a
 * comfortable floor on HTTP/2 — high enough to saturate the link, low enough that
 * the frames a fast scroll re-prioritises are not stuck behind a long queue of
 * requests that were already in flight for somewhere else in the sequence.
 */
const CONCURRENCY = 6;

/**
 * `createImageBitmap` decodes off the main thread and exposes `.close()` for
 * deterministic, immediate memory release — unlike an `HTMLImageElement`,
 * which only *might* be reclaimed whenever the GC gets around to it. Feature
 * detection happens once: Safari has only supported it from a Blob since 15.4,
 * so the `<img>` path below stays as the universal fallback.
 */
const supportsImageBitmap =
  typeof window !== "undefined" && typeof window.createImageBitmap === "function";

/** Either kind of decoded frame this module ever hands back to the canvas. */
export type DecodedFrame = ImageBitmap | HTMLImageElement;

type LoaderOptions = {
  /** 0–1, priority phase only: what the loading screen shows. */
  onProgress: (fraction: number) => void;
  /** The priority head is decoded and drawable. The site may now be revealed. */
  onReady: () => void;
  /** The priority head could not be loaded at all. */
  onError: (reason: string) => void;
  /**
   * A frame finished loading. The canvas repaints on this when the frame it is
   * currently approximating with a neighbour finally shows up.
   */
  onFrameLoaded: (index: number) => void;
};

export class FrameSequenceLoader {
  readonly set: FrameSet;

  private readonly options: LoaderOptions;
  private readonly limit: number;

  /**
   * The resident window. Insertion order roughly tracks fetch order, but
   * eviction is driven by distance from the playhead, not recency — a
   * scrubber revisits old ground constantly, and "far from here" is a better
   * predictor of "not needed soon" than "not fetched recently".
   */
  private readonly cache = new Map<number, DecodedFrame>();
  /** Requested but not yet settled, so `ensureWindow` never double-fetches. */
  private readonly inFlight = new Set<number>();

  /** Where the scrubber is right now, as a frame index. Steers the window. */
  private playhead = 0;
  private destroyed = false;

  constructor(set: FrameSet, options: LoaderOptions) {
    this.set = set;
    this.options = options;
    this.limit = cacheSize(set);
  }

  /**
   * Loads the priority head, reveals the site, then opens the progressive
   * window around the playhead (frame 0 at start).
   */
  async start(): Promise<void> {
    const head = priorityCount(this.set);
    const headIndices = Array.from({ length: head }, (_, i) => i);

    let settled = 0;
    let failed = 0;

    await this.runPool(headIndices, async (index) => {
      const ok = await this.fetch(index);
      if (!ok) failed += 1;
      // Count completions, not indices: six workers finish out of order, and a
      // progress bar that goes backwards is worse than no progress bar.
      settled += 1;
      this.options.onProgress(settled / head);
    });

    if (this.destroyed) return;

    // Every priority frame failed: the directory is missing or the network is
    // gone. Anything short of that is survivable — `nearest()` reaches past holes.
    if (failed === head) {
      this.options.onError(
        `None of the first ${head} frames under ${this.set.path} could be loaded.`,
      );
      return;
    }

    this.options.onReady();
    this.ensureWindow();
  }

  /**
   * Tell the loader where the visitor is. Re-centres the resident window on
   * the new position: fetches whatever is newly in range and evicts whatever
   * just fell out of it.
   */
  setPlayhead(index: number): void {
    if (index === this.playhead) return;
    this.playhead = index;
    this.ensureWindow();
  }

  /**
   * The best frame available for `index`: the frame itself if it is resident,
   * else the nearest resident neighbour, checked backwards first so a gap
   * reads as a held frame rather than a jump ahead. Null only while the
   * sequence is still empty.
   */
  nearest(index: number): DecodedFrame | null {
    const exact = this.cache.get(index);
    if (exact) return exact;

    for (let offset = 1; offset < this.set.count; offset += 1) {
      const before = this.cache.get(index - offset);
      if (before) return before;
      const after = this.cache.get(index + offset);
      if (after) return after;
    }

    return null;
  }

  destroy(): void {
    this.destroyed = true;
    this.inFlight.clear();
    for (const index of this.cache.keys()) this.evict(index);
  }

  /* ------------------------------------------------------------------ *
   * Internals
   * ------------------------------------------------------------------ */

  /**
   * Fetches whatever indices within `limit`-radius of the playhead are
   * missing, nearest first, and drops whatever fell outside that radius (or
   * beyond the hard cap, in case the radius itself outgrew it).
   */
  private ensureWindow(): void {
    const radius = Math.floor(this.limit / 2);
    const lo = Math.max(0, this.playhead - radius);
    const hi = Math.min(this.set.count - 1, this.playhead + radius);

    const needed: number[] = [];
    for (let index = lo; index <= hi; index += 1) {
      if (!this.cache.has(index) && !this.inFlight.has(index)) needed.push(index);
    }
    needed.sort(
      (a, b) => Math.abs(a - this.playhead) - Math.abs(b - this.playhead),
    );

    if (needed.length > 0) {
      void this.runPool(needed, async (index) => {
        await this.fetch(index);
      });
    }

    for (const index of this.cache.keys()) {
      if (index < lo || index > hi) this.evict(index);
    }

    // The window itself can hold more than `limit` slots at its edges once it
    // grows past the sequence's own bounds; the cap is enforced independently
    // so it holds regardless of where the playhead sits.
    if (this.cache.size > this.limit) {
      const overflow = [...this.cache.keys()].sort(
        (a, b) => Math.abs(b - this.playhead) - Math.abs(a - this.playhead),
      );
      while (this.cache.size > this.limit) {
        const index = overflow.shift();
        if (index === undefined) break;
        this.evict(index);
      }
    }
  }

  /** Drops a resident frame and releases its memory immediately if possible. */
  private evict(index: number): void {
    const frame = this.cache.get(index);
    this.cache.delete(index);
    if (frame && "close" in frame) frame.close();
  }

  /**
   * Runs `work` over `indices`, `CONCURRENCY` at a time. Indices are consumed
   * in the order given, so callers that want nearest-first behaviour sort
   * before calling.
   */
  private async runPool(
    indices: number[],
    work: (index: number) => Promise<void>,
  ): Promise<void> {
    let cursor = 0;

    const worker = async (): Promise<void> => {
      for (;;) {
        if (this.destroyed) return;
        const index = indices[cursor];
        cursor += 1;
        if (index === undefined) return;
        if (this.cache.has(index) || this.inFlight.has(index)) continue;
        await work(index);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, indices.length) }, worker),
    );
  }

  /** Resolves true if the frame is now decoded and resident. */
  private async fetch(index: number): Promise<boolean> {
    this.inFlight.add(index);

    try {
      const frame = await loadFrame(frameUrl(this.set, index));
      this.inFlight.delete(index);

      if (this.destroyed) {
        if ("close" in frame) frame.close();
        return false;
      }

      this.cache.set(index, frame);
      this.options.onFrameLoaded(index);
      return true;
    } catch {
      // A single dropped frame is not worth a retry: `nearest()` covers the hole
      // and a retry would compete with frames the visitor has not reached yet.
      this.inFlight.delete(index);
      return false;
    }
  }
}

/**
 * Decodes one frame. `createImageBitmap` is preferred where supported — it
 * decodes off the main thread and can be `.close()`d the instant it is
 * evicted. Everything else falls back to the classic `<img>` + `decode()`
 * dance, same as before.
 */
async function loadFrame(url: string): Promise<DecodedFrame> {
  if (supportsImageBitmap) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const blob = await response.blob();
    return window.createImageBitmap(blob);
  }

  return loadImageElement(url);
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return imageReady(image).then(() => image);
}

/**
 * Resolves once the image is not merely downloaded but *decoded*, so the first
 * `drawImage` cannot stall the compositor. `decode()` is missing on older Safari
 * and rejects spuriously in a few engines, so the load event backs it up rather
 * than the other way round.
 */
function imageReady(image: HTMLImageElement): Promise<void> {
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load ${image.src}`));
  });

  if (typeof image.decode !== "function") return loaded;

  return image
    .decode()
    .catch(() => loaded)
    .then(() => undefined);
}
