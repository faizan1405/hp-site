import { expect, test } from "@playwright/test";
import { trackFrameRequests } from "./helpers";

test.describe("reduced motion", () => {
  test("tells the same story with no canvas and no frames", async ({ page }) => {
    const requests = trackFrameRequests(page);

    // Must be emulated per-page: `reducedMotion` is not a config `use` option in
    // this version of Playwright, and passing it there silently does nothing.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // The fallback is plain stacked sections: same copy, no pin, no scrubbing.
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toContainText("Born from the Himalaya");
    await expect(
      page.getByRole("heading", { name: "Where the water begins" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The mountain the stones are named for" }),
    ).toBeVisible();

    // The device and the call to action survive the fallback: reduced motion means
    // less movement, not less product.
    await expect(page.locator("#purchase")).toContainText(
      "Bring the mountain home",
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Not one frame is fetched, and no canvas is ever mounted. A visitor who has
    // asked for less motion should not pay 6 MB for an animation they will not see.
    expect(requests).toEqual([]);
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
