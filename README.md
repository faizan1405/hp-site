# Himalayan Water Converter — scroll-controlled glacier experience

A single-product site whose hero is a glacier film the visitor turns by hand.
Scroll position maps straight onto a frame index, so the footage runs forwards and
backwards under the reader's thumb while the story fades through on top of it,
ending on the water-converter device itself.

It is an **image sequence painted into a canvas**, not a `<video>` — the Apple
product-page technique. A video element coalesces and throttles `currentTime`
seeks, which is exactly what makes fast and reverse scrolling stutter; a decoded
frame drawn into a canvas has no such behaviour, so the picture tracks the scroll
frame-for-frame in both directions.

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP ScrollTrigger.
No Three.js, no WebGL, no live 3D scene — the depth comes from the footage and
from layered 2.5D transforms.

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build

npm run frames  # re-extract the glacier frames (needs FFmpeg on the PATH)
npm run test:e2e
```

## Assets

| Path | Status |
| --- | --- |
| `public/images/device-front.png` | **The product.** Lossless tight crop of the client's supplied render — 424×1330, transparent |
| `public/images/ChatGPT Image Jul 13, 2026, 07_00_43 PM.png` | The client's original render, kept unmodified |
| `public/images/device-mask.png` | Alpha silhouette of the device. Clips the light sweep to its shape |
| `public/videos/glacier-journey.mp4` | **Synthetic placeholder** — replace with the real footage. Now the *source* for frame extraction, plus the `lite` background loop |
| `public/frames/desktop/` | 180 WebP frames, 1280×720, ~6.3 MB — generated, committed |
| `public/frames/mobile/` | 96 WebP frames, 768×432, ~1.7 MB — generated, committed |
| `public/images/video-poster.jpg` | Poster / first frame. Sits behind the canvas so the first paint is never black |
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

### The frame sequence

The scrubbed backdrop is a folder of stills, not a video. Replace
`public/videos/glacier-journey.mp4` with the real footage and re-run:

```bash
npm run frames   # requires FFmpeg (with libwebp) on the PATH
```

[`scripts/extract-frames.mjs`](scripts/extract-frames.mjs) rewrites both frame
directories and prints the counts it produced. **Copy those counts into `frames`
in [`src/config/content.ts`](src/config/content.ts)** — that config is the only
place the app learns how many frames exist, and the frame index is derived from it.

The old advice about encoding the mp4 with a keyframe on every frame (`-g 1`) no
longer applies to the scrubbed path: nothing seeks the video any more. It only
still matters for the `lite` background loop, where it costs nothing to keep.

Two sets exist because the frames are fetched by URL, not by `srcset` — the
breakpoint has to be decided in JavaScript before the first request goes out. A
phone gets fewer, smaller frames; it scrolls a shorter pin and has a fraction of
the decode budget.

## Content

All copy, commercial details, the nine internal layers and the scroll range of
every scene live in [`src/config/content.ts`](src/config/content.ts). Ranges are
positions on one timeline whose full length is `timelineLength`, and the pin is
exactly that long — so `{ inStart: 53, outEnd: 56.6 }` is always the same slice of
the scroll, and re-timing the story is an edit, not a refactor.

**The null rule.** Anything the client has not verified is `null` or an empty
array, never a stand-in like `₹—` or `example.com`. Every component hides its
element when the value behind it is missing: no price is configured, so no price
renders; no buy URL is configured, so no buy button renders. Fill a value in and
the UI appears on its own.

Still required from the client: the brand name, independent lab results for any
mineral, pH or ORP change the internal materials are only *intended* to produce
(see below), founder details, delivery details, price, buy URL, WhatsApp number,
and the final domain (`NEXT_PUBLIC_SITE_URL`). Contact details (email, phone,
address, hours) are set in `contact` in `src/config/content.ts`.

Nothing on this site may state or imply a medical, mineral, pH, purification or
certification claim until there is evidence for it. The copy is deliberately
descriptive rather than functional for that reason.

### The nine layers

`deviceLayers` in `content.ts` holds the stack the manufacturer's cutaway diagram
specifies — funnel, Himalayan stones, Japanese stones, jamun wood, silver,
magnesium, magnet, Korean media stones, zinc. Each has a `description` that says
what it **is** and where it sits, an `anchor` on the drawing, a side, and a scroll
window (assigned in order from `LAYER_WALK_START`).

Each also has an **optional `verifiedFunction`**, which is what it *does*, plus
`sourceNote` (which page of the client's product PDF it comes from) and
`verificationStatus` (how solid that source is — `"mechanical"` down to
`"lab verification required"`). `DeviceLayerCallout` renders `verifiedFunction`
only when it exists, and renders `sourceNote`/`verificationStatus` as one small
qualifying line beneath it, never as a separate pass/fail badge.

All nine are filled in with the client's own copy, kept verbatim and split at its
natural sentence boundary — the first sentence (what the layer *is*) into
`description`, the second (what it is designed or intended to do) into
`verifiedFunction`. None of the nine states a diabetes, blood-sugar,
digestion-treatment, blood-pressure, detox or immunity claim, an exact pH value,
or an exact mineral quantity — the boundaries this project works within.

This wording is a marketing-copy revision of an earlier, more heavily-disclaimed
draft, and it is less hedged than what it replaced: the earlier draft carried an
inline clause like "any mineral or pH change requires laboratory confirmation" on
several stones, and this one does not. That caveat has not disappeared — it now
lives entirely in `verificationStatus` (`"client-documented; lab verification
required"`, `"limited evidence"`, and so on) rather than inside the sentence
itself. See the comment above `layerSpecs` in `content.ts`.

### Benefits: all five are withheld

`verifiedBenefits` ships **empty**, `BenefitsSequence` therefore renders nothing,
and the benefits act consumes no scroll at all — the journey runs straight from the
layer walk to the pour. Five claims arrived with the client's reference artwork and
none of them can be published:

| Claim | Why it is blocked |
| --- | --- |
| Regulates blood sugar levels | Medical claim |
| Enhances insulin sensitivity | Medical claim |
| Improves digestion | Medical claim |
| Aids weight management | Medical claim |
| Rich in nutrients | Mineral-content claim — needs a lab report naming the minerals and their quantities |

The same restraint governs the finale: **no pH value is shown anywhere**, because
no test result exists to show one from.

## How it works

`GlacierExperience` pins a full-viewport section and hands ScrollTrigger a single
timeline `timelineLength` units long. A `requestAnimationFrame` loop reads that
timeline's progress, turns it into a frame index, and draws that frame into a
canvas. The footage is mapped onto the **glacier act alone** — it reaches its last
frame as the device arrives and holds there behind an opaque backdrop, rather than
crawling across a pin that is now mostly product.

Three things fall out of that design, and they are the whole point:

- **Reading the *timeline*, not the raw scroll position**, means the picture and
  the copy share one eased scrub and cannot drift apart.
- **Throttling to rAF, not to `onUpdate`**, means one paint per frame the screen
  actually shows. A trackpad fires several scroll events per displayed frame, and
  every one of them would otherwise be a wasted `drawImage`.
- **Reverse scrolling needs no code at all.** The frame index is a pure function
  of progress, so running the scroll backwards simply asks for lower indices —
  all of them already decoded and in memory.

React state is never touched during a scroll frame. Everything the draw path reads
lives in a ref; a single `setState` in there would re-render the whole scene tree
sixty times a second.

### Loading (`src/lib/frameSequence.ts`)

The site is never held hostage by the frame set. The loader fetches a small
**priority head** — 8% of the sequence, enough to cover the opening of the scroll
— reports ready, and streams the rest in behind the live page, six requests at a
time. Frames are decoded (`img.decode()`) before they are considered loaded, so the
first `drawImage` can never stall the compositor.

While the stream is still running, a scroll into un-loaded territory draws the
**nearest frame that has actually arrived** — biased backwards, so a gap reads as a
held frame rather than a jump — and repaints the moment the real one lands. The
progressive queue is re-pointed at the playhead between every single frame, so
flinging the scrollbar to the middle of the page fetches the middle of the
sequence next, not frame 17.

The canvas backing store is capped so it never exceeds the pixels the frame can
actually fill: the 720p source is drawn 1:1 and the compositor does the upscale,
instead of the CPU resampling a 1.25× (desktop) or 4× (phone) enlargement sixty
times a second.

### The journey

| Units | Scene |
| --- | --- |
| 0 – 38 | The summit → the glacier → Gonbo Rangjon → the descent. The footage ends here. |
| 36 – 53 | **The device**, from outside: it rises, settles, drifts, then comes at the camera and dissolves. |
| 48 – 88.6 | **How it works** — the cutaway, and the nine-layer walk (53 → 85.4, 3.6 units each). |
| 88 – … | Benefits. Empty, so this consumes nothing. |
| 88 – 93 | **The finale** settles: device and copy fade in. |
| 92 – 94 | **Pour** — the stream crosses from the outlet into the glass. |
| 94 – 100 | **Fill** — the glass rises, one-to-one with scroll (`ease: "none"`). |
| 101 – 104 | The finale exits — a full unit after the glass finished filling. |
| 103 – 108 | The call to action fades in and holds. |

### The device reveal

Built from one flat PNG, so everything that reads as depth is a separate layer on
a separate transform: the device rises, settles and drifts against the still-moving
glacier; a bloom, a ground reflection and two banks of mist sit behind and in front
of it; a bar of light sweeps across the copper, masked by `device-mask.png` — the
device's own alpha silhouette — so the light is clipped to the product rather than
to a rectangle. On the way out it scales *up* and blurs, so the cutaway rising
behind it reads as the inside of the thing we just entered.

**It is deliberately not a turntable.** A single flat PNG has no back and no
sides, so the tilt stays within a few degrees and reads as parallax. A genuine
revolving device needs a GLB/GLTF model, a transparent turntable image sequence,
or a pre-rendered rotation video — none of which exist yet.

### The layer walk (`HowItWorks` + `DeviceCutaway`)

The cutaway is an **inline SVG**, not a picture. The client's reference is a flat
raster — nine labels pointing at one image — and a raster cannot be taken apart
into nine things you can dim, glow and hang a connector line off. So the column is
drawn, in the site's own palette, with one addressable `<g data-layer>` per
material and a `<g data-halo>` behind it. (If a clean layered export ever arrives,
the geometry is one file.)

Per layer, inside its window: the other eight drop to `opacity: 0.2`, a halo comes
up behind the active one, a dot lights on the drawing, a hairline connector runs
out to its name and description, and the water front arrives at it.

`WaterFlow` is one element animated with **nothing but `yPercent`**, from `-100`
(entirely above its mask) to `0`. Its gradient is brightest at its own bottom edge,
so that edge *is* the water's surface, and everything above it reads as wet. One
composited transform — no height animation, no `clip-path`, no per-frame layout.
The same component pours into the glass in the finale.

Reverse scrolling is free, everywhere. There is no state machine listening for a
scroll direction and no "current layer" in React: at any scroll position the whole
picture — which layer is lit, how far the water has fallen, which words are on
screen — is a pure function of the timeline's progress.

Below `lg` the connectors are dropped and each callout sits under the drawing
instead. The walk is a visual sequence, so its content is *also* emitted as a plain
`sr-only` ordered list — `visibility: hidden` layers are invisible to assistive
tech, and the nine materials are not decoration.

Reflection, mist and the water droplets are desktop-only, blur transitions are
disabled on mobile, and nothing in the scene animates a layout property or runs
while it is off screen.

### Three paths

Chosen at mount by `useExperienceMode`:

- **scrub** — the full experience (~1,210vh desktop, ~880vh mobile — the pin is
  `viewports × timelineLength`, so it grows if benefits are added; mobile gets the
  smaller frame set and drops the blur and glass effects).
- **lite** — Data Saver or a low-core / low-memory device: the mp4 plays as a muted
  looping backdrop behind normal stacked sections. No frames are fetched.
- **reduced** — `prefers-reduced-motion`: the poster image and the same stacked
  sections, with no scrubbing at all. **No frames are fetched** — a visitor who
  asked for less motion should not pay 6 MB for an animation they will not see.

The device stays fully visible in all three: reduced motion means less movement,
not less product.

If the opening frames fail or never arrive (15s), the page falls back to the
poster, logs a useful error, and keeps every section usable. A dropped frame
mid-sequence is not even an error — the nearest neighbour covers the hole. It
never shows a blank screen.

## Tests

```bash
npm run test:e2e
```

Playwright, against a **production build** (`next dev` ships an unminified React
whose per-render instrumentation would make a frame-rate assertion meaningless).
Three projects — desktop, Pixel 5, and reduced-motion — covering the things that
actually break this kind of page:

- the site reveals itself having requested a *fraction* of the sequence, and the
  canvas is showing a glacier rather than a black rectangle;
- **fast scrolling**: the scroll position is slammed across the pin faster than the
  sequence can stream, and the canvas must never blank, throw, or wedge the loop;
- **reverse scrolling**: the journey run backwards must land back on *exactly* the
  frame it opened with, bit for bit;
- **mobile**: a phone gets the mobile frame set and never the desktop one, and the
  scrub holds its frame rate;
- **reduced motion**: zero frame requests, zero canvases, same story.

Frame-rate assertions run under software rasterisation (SwiftShader) in CI, so they
are regression guards — they catch a change that makes the mobile path do
desktop-sized work — rather than claims about real hardware.
