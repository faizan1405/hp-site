import { defineConfig, devices } from "@playwright/test";

/**
 * Not 3000: that port is routinely taken by another project's dev server, and
 * `reuseExistingServer` will happily bind to it and test the wrong site.
 */
const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * The suites here exercise the scroll-scrubbed canvas: that it reveals the site
 * without waiting for the whole frame sequence, that it survives fast and reverse
 * scrolling, that a phone gets the mobile frame set at a workable frame rate, and
 * that a reduced-motion visitor never downloads a frame at all.
 *
 * They run against a production build, not `next dev`: dev ships an unminified
 * React with per-render instrumentation, and a frame-rate assertion measured
 * against that would be meaningless.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",

    launchOptions: {
      /**
       * Without this, headless Chromium quietly falls back to SwiftShader — a
       * *software* rasteriser. Every frame-rate number measured against it
       * describes a CPU emulating a GPU, not a browser: the canvas blit and the
       * scene's blur filters both collapse to single-digit milliseconds of real
       * work on hardware, and tens of milliseconds under SwiftShader.
       *
       * Measuring the scrub on the real GPU is the whole point of these tests.
       * Where no GPU exists (most CI images), Chromium falls back to SwiftShader
       * on its own and the frame-rate assertions become the loose regression
       * guards described in the specs — nothing breaks, it just measures less.
       */
      args: ["--enable-gpu"],
    },
  },

  projects: [
    {
      name: "desktop",
      testMatch: /desktop\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "reduced-motion",
      testMatch: /reduced-motion\.spec\.ts/,
      // The preference is emulated inside the spec with `page.emulateMedia`, not
      // here: `reducedMotion` is not a `use` option in this version of Playwright,
      // and setting it here is accepted at runtime while doing nothing at all.
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
