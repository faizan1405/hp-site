import { expect, test } from "@playwright/test";
import { frames } from "../src/config/content";
import {
  scrollAndMeasure,
  settle,
  signature,
  trackConsoleErrors,
  trackFrameRequests,
  waitForExperience,
} from "./helpers";

test.describe("scroll-scrubbed canvas — mobile", () => {
  test("a phone gets the mobile frame set, never the desktop one", async ({
    page,
  }) => {
    const requests = trackFrameRequests(page);

    await page.goto("/");
    await waitForExperience(page);
    await page.waitForTimeout(1500);

    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((url) => url.startsWith("/frames/mobile/"))).toBe(true);
    // Shipping the 1280×720 set to a phone would be the whole regression.
    expect(requests.some((url) => url.startsWith("/frames/desktop/"))).toBe(false);
  });

  test("reveals the site without waiting for the whole sequence", async ({
    page,
  }) => {
    const requests = trackFrameRequests(page);
    const errors = trackConsoleErrors(page);

    await page.goto("/");
    await waitForExperience(page);

    expect(requests.length).toBeLessThan(frames.mobile.count);

    const opening = await signature(page);
    expect(opening.mean).toBeGreaterThan(8);

    expect(errors).toEqual([]);
  });

  test("scrubs at a usable frame rate on a phone", async ({ page }) => {
    await page.goto("/");
    await waitForExperience(page);
    await page.waitForTimeout(2500);

    const { fps, longFrames, samples } = await scrollAndMeasure(page, {
      from: 0,
      to: 1,
      durationMs: 3000,
    });

    console.log(
      `mobile scrub: ${fps.toFixed(1)} fps, ${longFrames}/${samples} frames over 33ms`,
    );

    expect(samples).toBeGreaterThan(60);
    // Emulation runs on desktop silicon, so this is a regression guard rather than
    // a claim about real hardware: it catches a change that makes the mobile path
    // do desktop-sized work (full-res frames, un-throttled paints, a blur that
    // slipped past the `isDesktop` gate), which is what actually kills phones here.
    expect(fps).toBeGreaterThan(50);
    expect(longFrames).toBeLessThan(samples * 0.1);
  });

  test("fast and reverse scrolling both track the scroll", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await page.goto("/");
    await waitForExperience(page);

    const opening = await settle(page);

    // A thumb-flick to the bottom of the page, which is the mobile worst case.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const ending = await settle(page);
    expect(ending.mean).toBeGreaterThan(8);
    expect(ending.hash).not.toBe(opening.hash);

    // …and straight back up again.
    await page.evaluate(() => window.scrollTo(0, 0));
    const returned = await settle(page);
    expect(returned.hash).toBe(opening.hash);

    expect(errors).toEqual([]);
  });

  test("the story and the CTA still render", async ({ page }) => {
    await page.goto("/");
    await waitForExperience(page);

    await expect(
      page.getByRole("heading", { level: 1, includeHidden: true }),
    ).toContainText("Born from the Himalaya");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page);

    await expect(page.locator("#purchase")).toContainText(
      "Bring the mountain home",
    );
  });
});
