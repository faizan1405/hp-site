#!/usr/bin/env node
/**
 * Explodes the glacier footage into the two WebP frame sequences the pinned
 * canvas experience scrubs through.
 *
 *   node scripts/extract-frames.mjs
 *
 * Requires FFmpeg on the PATH (a build with libwebp — any recent release has it).
 * Prints the frame counts when it finishes: copy them into the `frames` config in
 * `src/config/content.ts`, which is the only place the app learns how many frames
 * exist.
 *
 * Why two sets rather than one responsive one: the frames are fetched by URL, not
 * by `srcset`, so the breakpoint has to be decided in JavaScript before the first
 * request goes out. A phone gets fewer, smaller frames — it scrolls a shorter pin
 * and has a fraction of the decode budget.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/videos/glacier-journey.mp4");

/**
 * `frames` is the target count for the whole clip, not a frame rate: the script
 * derives the sampling rate from the source's real duration, so re-cutting the
 * footage to a different length still yields exactly this many frames.
 *
 * `quality` is libwebp's 0–100 scale. The footage is snow and rock — high-entropy
 * detail that punishes aggressive quantisation — so these are tuned by eye against
 * file size rather than pinned to a round number.
 */
const RENDITIONS = [
  { name: "desktop", frames: 180, width: 1280, height: 720, quality: 66 },
  { name: "mobile", frames: 96, width: 768, height: 432, quality: 58 },
];

function ffprobeDuration() {
  const output = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      source,
    ],
    { encoding: "utf8" },
  );

  const duration = Number.parseFloat(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read a duration from ${source}`);
  }
  return duration;
}

function extract(rendition, duration) {
  const outDir = join(root, "public/frames", rendition.name);

  // Wholesale rewrite. Leaving stale frames behind would silently mix two cuts of
  // the footage into one sequence, and the tail of the longer one would never be
  // reached because the count in content.ts caps the index.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const fps = (rendition.frames / duration).toFixed(4);

  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", source,
      "-vf", `fps=${fps},scale=${rendition.width}:${rendition.height}:flags=lanczos`,
      "-c:v", "libwebp",
      "-quality", String(rendition.quality),
      "-compression_level", "6",
      "-preset", "picture",
      "-an",
      // Emit exactly what the fps filter produced; the default duplicates frames
      // to hit a constant rate, which would put identical stills on disk twice.
      "-fps_mode", "passthrough",
      join(outDir, "frame-%04d.webp"),
    ],
    { stdio: "inherit" },
  );

  const files = readdirSync(outDir).filter((file) => file.endsWith(".webp"));
  const bytes = files.reduce(
    (total, file) => total + statSync(join(outDir, file)).size,
    0,
  );

  return { count: files.length, bytes };
}

const duration = ffprobeDuration();
console.log(`Source: ${source} (${duration.toFixed(2)}s)\n`);

for (const rendition of RENDITIONS) {
  const { count, bytes } = extract(rendition, duration);
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const avg = Math.round(bytes / count / 1024);

  console.log(
    `${rendition.name.padEnd(8)} ${String(count).padStart(4)} frames  ` +
      `${rendition.width}×${rendition.height}  ${mb} MB total  ~${avg} KB/frame`,
  );
  console.log(
    `${" ".repeat(9)}→ set frames.${rendition.name}.count = ${count} in src/config/content.ts`,
  );
}
