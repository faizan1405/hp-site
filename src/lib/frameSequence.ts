import type { FrameSet } from "@/config/content";

/**
 * Loads a frame sequence for the scroll-scrubbed canvas.
 *
 * The contract this class exists to honour: **the site is never held hostage by
 * the frame set.** It loads a small priority head — enough to cover the opening
 * of the scroll — reports ready, and streams the remaining frames in behind the
 * live experience. A visitor who scrolls before the stream finishes sees the
 * nearest frame that has actually arrived, never a blank canvas and never a stall.
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
  return Math.min(20, Math.max(6, Math.ceil(set.count * 0.08)));
}

/**
 * Parallel requests. Six is the classic per-host cap on HTTP/1.1 and a
 * comfortable floor on HTTP/2 — high enough to saturate the link, low enough that
 * the frames a fast scroll re-prioritises are not stuck behind a long queue of
 * requests that were already in flight for somewhere else in the sequence.
 */
const CONCURRENCY = 6;

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
  private readonly images: (HTMLImageElement | null)[];
  /** Frames not yet requested. Requested ones leave the set immediately. */
  private readonly queued: Set<number>;

  /** Where the scrubber is right now, as a frame index. Steers the queue. */
  private playhead = 0;
  private loadedCount = 0;
  private destroyed = false;

  constructor(set: FrameSet, options: LoaderOptions) {
    this.set = set;
    this.options = options;
    this.images = new Array<HTMLImageElement | null>(set.count).fill(null);
    this.queued = new Set(Array.from({ length: set.count }, (_, i) => i));
  }

  /**
   * Loads the priority head, reveals the site, then streams the remainder. The
   * two phases differ only in which frames they pull and who is told about them.
   */
  async start(): Promise<void> {
    const head = priorityCount(this.set);
    let issued = 0;
    let settled = 0;
    let failed = 0;

    await this.pool(
      () => (issued < head ? issued++ : null),
      async (index) => {
        const ok = await this.fetch(index);
        if (!ok) failed += 1;
        // Count completions, not indices: six workers finish out of order, and a
        // progress bar that goes backwards is worse than no progress bar.
        settled += 1;
        this.options.onProgress(settled / head);
      },
    );

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

    // The rest, nearest-to-the-playhead first, for as long as the component lives.
    await this.pool(
      () => this.takeNearestQueued(),
      async (index) => {
        await this.fetch(index);
      },
    );
  }

  /**
   * Tell the loader where the visitor is. A fast scroll deep into the page
   * re-points the queue at what is on screen instead of plodding through the
   * sequence from the top.
   */
  setPlayhead(index: number): void {
    this.playhead = index;
  }

  /**
   * The best frame available for `index`: the frame itself if it has loaded, else
   * the nearest loaded neighbour, checked backwards first so a gap reads as a held
   * frame rather than a jump ahead. Null only while the sequence is still empty.
   */
  nearest(index: number): HTMLImageElement | null {
    const exact = this.images[index];
    if (exact) return exact;

    for (let offset = 1; offset < this.set.count; offset += 1) {
      const before = this.images[index - offset];
      if (before) return before;
      const after = this.images[index + offset];
      if (after) return after;
    }

    return null;
  }

  /** True once every frame the sequence will ever have is in memory. */
  get complete(): boolean {
    return this.loadedCount === this.set.count;
  }

  destroy(): void {
    this.destroyed = true;
    this.queued.clear();
    // Drop the decoded bitmaps. 180 frames of 1280×720 is real memory, and the
    // fallback that replaces this component has no use for any of it.
    this.images.fill(null);
  }

  /* ------------------------------------------------------------------ *
   * Internals
   * ------------------------------------------------------------------ */

  /**
   * Runs `work` over whatever `next` hands out, `CONCURRENCY` at a time, until it
   * hands out null. `next` is consulted at the last possible moment, which is what
   * lets the progressive phase re-target the playhead between every single frame.
   */
  private async pool(
    next: () => number | null,
    work: (index: number) => Promise<void>,
  ): Promise<void> {
    const worker = async (): Promise<void> => {
      for (;;) {
        if (this.destroyed) return;
        const index = next();
        if (index === null) return;
        await work(index);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, this.set.count) }, worker),
    );
  }

  /**
   * Pulls the queued frame closest to the playhead. Linear over the queue, which
   * peaks at a couple of hundred entries — cheaper in practice than maintaining a
   * heap that would have to be rebuilt every time the playhead moved.
   */
  private takeNearestQueued(): number | null {
    let best: number | null = null;
    let bestDistance = Infinity;

    for (const index of this.queued) {
      const distance = Math.abs(index - this.playhead);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }

    if (best !== null) this.queued.delete(best);
    return best;
  }

  /** Resolves true if the frame is now decoded and drawable. */
  private async fetch(index: number): Promise<boolean> {
    this.queued.delete(index);

    const image = new Image();
    image.decoding = "async";
    image.src = frameUrl(this.set, index);

    try {
      await imageReady(image);
      if (this.destroyed) return false;

      this.images[index] = image;
      this.loadedCount += 1;
      this.options.onFrameLoaded(index);
      return true;
    } catch {
      // A single dropped frame is not worth a retry: `nearest()` covers the hole
      // and a retry would compete with frames the visitor has not reached yet.
      return false;
    }
  }
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
