# Aqua Glacia — scroll-controlled glacier experience

A single-product site whose hero is a glacier video that never plays. Scroll
position maps straight onto the video's timeline, so the visitor is effectively
turning the reel by hand — forwards and backwards — while six scenes of copy fade
through on top of it.

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP ScrollTrigger.
No Three.js, no WebGL, no live 3D scene — the depth comes from the footage.

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Assets

| Path | Status |
| --- | --- |
| `public/videos/glacier-journey.mp4` | **Synthetic placeholder** — replace with the real footage |
| `public/images/product-front.png` | Placeholder bottle, transparent background |
| `public/images/video-poster.jpg` | Placeholder poster / first frame |
| `public/images/logo.svg` | Placeholder wordmark |

Every one of these is a stand-in generated to make the site runnable. Overwrite
them in place — the filenames are what the code expects, so nothing else changes.

**Read [`public/videos/README.md`](public/videos/README.md) before exporting the
video.** Scrubbed video needs a keyframe on *every* frame (`-g 1`); a normally
encoded clip will seek like a slideshow no matter how good the code is.

## Content

All copy, pricing, contact details, the WhatsApp number and the scroll range of
every scene live in [`src/config/content.ts`](src/config/content.ts). Scene
ranges are plain percentages of the pinned scroll — `{ inStart: 15, outEnd: 35 }`
is literally 15%–35% — so re-timing the story is an edit, not a refactor.

Placeholders to fill in before launch: `scenes.cta.price`, `scenes.cta.buyHref`,
`scenes.cta.whatsappNumber`, everything in `contact`, and `seo.siteUrl`.

## How it works

`GlacierExperience` pins a full-viewport section and hands ScrollTrigger a single
100-unit timeline, where one unit is one percent of the scroll. A
`requestAnimationFrame` loop reads that timeline's progress and writes
`video.currentTime` — reading the *timeline* rather than the raw scroll position
means the video and the copy share one eased scrub and cannot drift apart. React
state is never touched during a scroll frame.

Three paths exist, chosen at mount by `useExperienceMode`:

- **scrub** — the full experience (600vh desktop, 450vh mobile; mobile seeks less
  often and drops the blur and glass effects).
- **lite** — Data Saver or a low-core / low-memory device: the video plays as a
  muted looping backdrop behind normal stacked sections.
- **reduced** — `prefers-reduced-motion`: the poster image and the same stacked
  sections, with no seeking at all.

If the video fails or its metadata never arrives (15s), the page falls back to
the poster, logs a useful error, and keeps every product section and both
call-to-action buttons usable. It never shows a blank screen.
