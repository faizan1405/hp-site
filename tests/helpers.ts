import type { Page, Request } from "@playwright/test";

/**
 * A cheap fingerprint of whatever is currently on the canvas.
 *
 * Downsampling to 32×18 before hashing is the point: it makes the signature
 * robust to WebP's per-frame quantisation noise while staying wildly sensitive to
 * the thing we actually care about — whether a *different glacier frame* is on
 * screen. `mean` separates "a frame is drawn" from "the canvas is still black".
 */
export type Signature = { hash: number; mean: number };

export async function signature(page: Page): Promise<Signature> {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas || canvas.width === 0) return { hash: 0, mean: 0 };

    const thumb = document.createElement("canvas");
    thumb.width = 32;
    thumb.height = 18;

    const context = thumb.getContext("2d");
    if (!context) return { hash: 0, mean: 0 };

    context.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const { data } = context.getImageData(0, 0, thumb.width, thumb.height);

    let hash = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      hash = (Math.imul(hash, 31) + data[i]) >>> 0;
      hash = (Math.imul(hash, 31) + data[i + 1]) >>> 0;
      hash = (Math.imul(hash, 31) + data[i + 2]) >>> 0;
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    return { hash, mean: total / (data.length / 4) };
  });
}

/**
 * Waits for the picture to stop moving.
 *
 * The scrub carries an ease of up to 0.6s, and a frame that was being
 * approximated by a neighbour repaints itself the moment the real one lands — so
 * "the scroll event finished" is not the same as "the canvas is final". Poll until
 * the signature holds still.
 */
export async function settle(page: Page, timeoutMs = 6000): Promise<Signature> {
  const deadline = Date.now() + timeoutMs;
  let previous = await signature(page);
  let stableFor = 0;

  while (Date.now() < deadline) {
    await page.waitForTimeout(120);
    const current = await signature(page);

    if (current.hash === previous.hash) {
      stableFor += 1;
      if (stableFor >= 3) return current;
    } else {
      stableFor = 0;
    }
    previous = current;
  }

  return previous;
}

/** Every frame image the page has asked for, in request order. */
export function trackFrameRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request: Request) => {
    const url = new URL(request.url()).pathname;
    if (url.startsWith("/frames/")) urls.push(url);
  });
  return urls;
}

/** Fails the test loudly if the app logged an error (it does so on fallback). */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

/** The loading screen is gone: the experience is live. */
export async function waitForExperience(page: Page): Promise<void> {
  await page.waitForSelector("canvas", { state: "attached" });
  await page.waitForFunction(
    () => {
      const loader = document.querySelector('[role="status"]');
      return !loader || loader.getAttribute("aria-busy") === "false";
    },
    undefined,
    { timeout: 20_000 },
  );
}

/** Total scrollable distance of the pinned page. */
export function scrollHeight(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
}

/**
 * Drives a scripted scroll from `from` to `to` (both 0–1 of the scrollable range)
 * over `durationMs`, sampling `requestAnimationFrame` the whole way.
 *
 * Reports what the visitor would actually feel: the achieved frame rate, and how
 * many frames took longer than two 60Hz budgets (33ms) — a single number for
 * "did the scrub hitch".
 */
export async function scrollAndMeasure(
  page: Page,
  { from, to, durationMs }: { from: number; to: number; durationMs: number },
): Promise<{ fps: number; longFrames: number; samples: number }> {
  return page.evaluate(
    ({ from, to, durationMs }) =>
      new Promise<{ fps: number; longFrames: number; samples: number }>(
        (resolve) => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const start = performance.now();
          const deltas: number[] = [];
          let last = start;

          const step = (now: number) => {
            deltas.push(now - last);
            last = now;

            const t = Math.min(1, (now - start) / durationMs);
            window.scrollTo(0, max * (from + (to - from) * t));

            if (t < 1) {
              requestAnimationFrame(step);
              return;
            }

            // Drop the first sample: it spans the gap from the last browser paint
            // to the start of the run and says nothing about scrolling.
            const measured = deltas.slice(1);
            const total = measured.reduce((sum, d) => sum + d, 0);

            resolve({
              fps: measured.length / (total / 1000),
              longFrames: measured.filter((d) => d > 33).length,
              samples: measured.length,
            });
          };

          requestAnimationFrame(step);
        },
      ),
    { from, to, durationMs },
  );
}
