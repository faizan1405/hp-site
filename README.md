# Himalayan Water Converter — scroll-controlled glacier experience

A single-product site whose hero is a glacier video that never plays. Scroll
position maps straight onto the video's timeline, so the visitor is effectively
turning the reel by hand — forwards and backwards — while the story fades through
on top of it, ending on the water-converter device itself.

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP ScrollTrigger.
No Three.js, no WebGL, no live 3D scene — the depth comes from the footage and
from layered 2.5D transforms.

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build

# Exercise the stone-callout system with obviously-fake placeholder data.
# Never set this in production.
NEXT_PUBLIC_PREVIEW_ELEMENTS=1 npm run dev
```

## Assets

| Path | Status |
| --- | --- |
| `public/images/device-front.png` | **The product.** Lossless tight crop of the client's supplied render — 424×1330, transparent |
| `public/images/ChatGPT Image Jul 13, 2026, 07_00_43 PM.png` | The client's original render, kept unmodified |
| `public/images/device-mask.png` | Alpha silhouette of the device. Clips the light sweep to its shape |
| `public/videos/glacier-journey.mp4` | **Synthetic placeholder** — replace with the real footage |
| `public/images/video-poster.jpg` | Placeholder poster / first frame |
| `public/images/logo.svg` | **Unused.** Still reads "Himalaya Sparsh", which is not the confirmed brand |

### ⚠ The device render needs a clean re-export

`device-front.png` is the render the client supplied, cropped but otherwise
untouched. Its printed label carries several things the site cannot stand behind,
and they are legible at desktop reveal size:

- an **ISO certification badge** and two other certification-style marks, none of
  which we have evidence for;
- **"HIMALAYA SPARSH" / "The Living Water"** branding, which is not the confirmed
  brand;
- garbled AI-generated text (*"CERTELEAM TSO SOOL RYROUM"*, *"INTERUATIONALY
  GEREINGH OURITORBOIN GENIOR"*, *"Himalano Mapselc Ouyan Water Vitalanns"*).

A clean export — ideally a transparent PNG of the device with no printed label,
or with the final approved label — should replace it before launch. Drop it in and
point `assets.device` at it; nothing else changes.

**Read [`public/videos/README.md`](public/videos/README.md) before exporting the
video.** Scrubbed video needs a keyframe on *every* frame (`-g 1`); a normally
encoded clip will seek like a slideshow no matter how good the code is.

## Content

All copy, commercial details and the scroll range of every scene live in
[`src/config/content.ts`](src/config/content.ts). Scene ranges are plain
percentages of the pinned scroll — `{ inStart: 58, outEnd: 92 }` is literally
58%–92% — so re-timing the story is an edit, not a refactor.

**The null rule.** Anything the client has not verified is `null` or an empty
array, never a stand-in like `₹—` or `example.com`. Every component hides its
element when the value behind it is missing: no price is configured, so no price
renders; no buy URL is configured, so no buy button renders. Fill a value in and
the UI appears on its own.

Still required from the client: the brand name, the product's real name, the
verified stone list and what each stone does (with sources), founder details,
delivery details, price, buy URL, WhatsApp number, contact details, and the final
domain (`NEXT_PUBLIC_SITE_URL`).

Nothing on this site may state or imply a medical, mineral, pH, purification or
certification claim until there is evidence for it. The copy is deliberately
descriptive rather than functional for that reason.

### The stones

`deviceElements` in `content.ts` ships **empty**. The callout system that renders
it is finished: give it a list of `DeviceElement`s — each with a name, a short
description, an optional verified function, an anchor point on the device and a
scroll window — and they appear one at a time beside the device, with a hairline
connector running from the text to the anchor. Below `lg` the connector is dropped
and the text sits under the device instead.

`NEXT_PUBLIC_PREVIEW_ELEMENTS=1` renders `devPreviewElements` so the mechanism can
be seen without inventing stone names on the public site.

## How it works

`GlacierExperience` pins a full-viewport section and hands ScrollTrigger a single
100-unit timeline, where one unit is one percent of the scroll. A
`requestAnimationFrame` loop reads that timeline's progress and writes
`video.currentTime` — reading the *timeline* rather than the raw scroll position
means the video and the copy share one eased scrub and cannot drift apart. React
state is never touched during a scroll frame.

The journey: the summit → the glacier and the water source → Gonbo Rangjon, the
mountain the stones are named for → the descent toward the device → **the device**
→ the stones inside it → the call to action.

### The device reveal (58%–92%)

Built from one flat PNG, so everything that reads as depth is a separate layer on
a separate transform:

- the device rises, settles and drifts (`y`, `scale`, a few degrees of `rotateX`
  and `rotateY`) against the still-moving glacier behind it;
- a glacier-blue bloom, a soft ground reflection and two banks of mist sit behind
  and in front of it;
- a bar of light sweeps across the copper, masked by `device-mask.png` — the
  device's own alpha silhouette — so the light is clipped to the product rather
  than to a rectangle;
- two copy blocks cross-fade in a single CSS grid cell, so swapping them costs no
  layout shift.

**It is deliberately not a turntable.** A single flat PNG has no back and no
sides, so the tilt stays within a few degrees and reads as parallax. A genuine
revolving device needs a GLB/GLTF model, a transparent turntable image sequence,
or a pre-rendered rotation video — none of which exist yet.

Reflection and mist are desktop-only, blur transitions are disabled on mobile, and
nothing in the scene animates a layout property or runs while it is off screen.

Three paths exist, chosen at mount by `useExperienceMode`:

- **scrub** — the full experience (600vh desktop, 450vh mobile; mobile seeks less
  often and drops the blur and glass effects).
- **lite** — Data Saver or a low-core / low-memory device: the video plays as a
  muted looping backdrop behind normal stacked sections.
- **reduced** — `prefers-reduced-motion`: the poster image and the same stacked
  sections, with no seeking at all.

The device stays fully visible in all three: reduced motion means less movement,
not less product.

If the video fails or its metadata never arrives (15s), the page falls back to the
poster, logs a useful error, and keeps every section usable. It never shows a
blank screen.
