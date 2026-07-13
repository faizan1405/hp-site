import { expect, test } from "@playwright/test";
import { frames } from "../src/config/content";
import {
  scrollAndMeasure,
  scrollHeight,
  settle,
  signature,
  trackConsoleErrors,
  trackFrameRequests,
  waitForExperience,
} from "./helpers";

test.describe("scroll-scrubbed canvas — desktop", () => {
  test("reveals the site without waiting for the whole sequence", async ({
    page,
  }) => {
    const requests = trackFrameRequests(page);
    const errors = trackConsoleErrors(page);

    await page.goto("/");
    await waitForExperience(page);

    // The headline is on screen and readable, not hidden behind a loading bar.
    await expect(
      page.getByRole("heading", { level: 1, includeHidden: true }),
    ).toContainText("Born from the Himalaya");

    // The whole point of the priority head: the experience went live having asked
    // for a fraction of the sequence. If this ever equals the full count, the
    // progressive loader has silently become a blocking one.
    const requestedAtReveal = requests.length;
    expect(requestedAtReveal).toBeGreaterThan(0);
    expect(requestedAtReveal).toBeLessThan(frames.desktop.count);

    // …and the canvas is showing an actual glacier, not an empty black rectangle.
    const opening = await signature(page);
    expect(opening.mean).toBeGreaterThan(8);

    expect(errors).toEqual([]);
  });

  test("desktop gets the desktop frame set", async ({ page }) => {
    const requests = trackFrameRequests(page);

    await page.goto("/");
    await waitForExperience(page);

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((url) => url.startsWith("/frames/desktop/"))).toBe(true);
  });

  test("fast scrolling lands on the right frame", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await page.goto("/");
    await waitForExperience(page);

    const opening = await settle(page);
    const max = await scrollHeight(page);
    expect(max).toBeGreaterThan(0);

    // Slam the scroll position across the pin with no easing and barely a breath
    // between jumps — far faster than a human, and far faster than the sequence
    // can stream. Nothing here may throw, blank the canvas, or wedge the loop.
    const seen = new Set<number>();
    for (const fraction of [0.9, 0.15, 0.75, 0.3, 0.98, 0.05, 0.6]) {
      await page.evaluate((f) => {
        const range =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, range * f);
      }, fraction);
      await page.waitForTimeout(40);

      const during = await signature(page);
      // Mid-flight the canvas may be showing a neighbouring frame while the exact
      // one streams in — but it must always be showing *something*.
      expect(during.mean).toBeGreaterThan(8);
      seen.add(during.hash);
    }

    // The canvas genuinely moved through the sequence rather than sticking.
    expect(seen.size).toBeGreaterThan(1);

    // Once it stops, the picture must agree with where the scroll actually is:
    // the end of the journey does not look like the start of it.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const ending = await settle(page);
    expect(ending.mean).toBeGreaterThan(8);
    expect(ending.hash).not.toBe(opening.hash);

    expect(errors).toEqual([]);
  });

  test("reverse scrolling returns to the frame it started on", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);

    await page.goto("/");
    await waitForExperience(page);

    const opening = await settle(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const ending = await settle(page);
    expect(ending.hash).not.toBe(opening.hash);

    // Run the whole journey backwards, in stages, and check the picture tracks the
    // scroll on the way back rather than only on the way out.
    for (const fraction of [0.75, 0.5, 0.25]) {
      await page.evaluate((f) => {
        const range =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, range * f);
      }, fraction);
      const during = await settle(page);
      expect(during.mean).toBeGreaterThan(8);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    const returned = await settle(page);

    // The frame index is a pure function of scroll progress, so scrolling back to
    // the top must land on exactly the frame we opened with — bit for bit.
    expect(returned.hash).toBe(opening.hash);

    expect(errors).toEqual([]);
  });

  test("scrubs at a smooth frame rate", async ({ page }) => {
    await page.goto("/");
    await waitForExperience(page);

    // Give the sequence a moment to stream so this measures the steady state a
    // real visitor scrolls through, not a cold cache.
    await page.waitForTimeout(2500);

    const { fps, longFrames, samples } = await scrollAndMeasure(page, {
      from: 0,
      to: 1,
      durationMs: 3000,
    });

    console.log(
      `desktop scrub: ${fps.toFixed(1)} fps, ${longFrames}/${samples} frames over 33ms`,
    );

    expect(samples).toBeGreaterThan(60);
    expect(fps).toBeGreaterThan(50);
    // A handful of long frames is normal (GC, a late decode). A stream of them is
    // the slideshow we replaced the video to get rid of.
    expect(longFrames).toBeLessThan(samples * 0.1);
  });

  test("the CTA survives the whole journey", async ({ page }) => {
    await page.goto("/");
    await waitForExperience(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page);

    const cta = page.locator("#purchase");
    await expect(cta).toBeVisible();
    await expect(cta).toContainText("Bring the mountain home");
  });
});
