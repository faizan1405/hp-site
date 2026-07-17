# Himalaya Sparsh — scroll-controlled glacier experience

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

## Backend & accounts

MongoDB, Google Sign-In (Auth.js v5), Cloudinary image uploads, a protected
customer dashboard and an admin panel. Node.js runtime throughout (MongoDB and
Auth.js's database session strategy both need it — nothing here runs on Edge).

### Environment setup

1. Copy the template: `cp .env.example .env.local` (never commit `.env.local`
   — it's gitignored via the repo's `.env*` rule).
2. Fill in every variable below, then restart `next dev`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas (or any) connection string |
| `MONGODB_DB_NAME` | No (defaults to `himalaya_sparsh`) | Database name |
| `AUTH_SECRET` | Yes | Signs Auth.js session cookies — generate with `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client credentials |
| `AUTH_TRUST_HOST` | Recommended (`true`) | Required by Auth.js on most hosts other than Vercel's own edge network |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL — also used for metadata/OG tags (see "Content" below) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | No — uploads 400 until set | Image uploads (profile photos, review photos) |
| `ADMIN_EMAILS` | No | Comma-separated Google account emails auto-promoted to `ADMIN` on sign-in |
| `CONTACT_RECEIVER_EMAIL` | No | Where contact-form notification emails go, if Resend is configured |
| `ADMIN_LOGIN_EMAIL` / `ADMIN_LOGIN_PASSWORD_HASH` | No — `/admin/login` rejects everything until set | The fixed admin credentials-login account; see "Admin credentials login" below |
| `RESEND_API_KEY` / `EMAIL_FROM` | No | Enables the optional contact-notification email. Enquiries save to MongoDB either way — this only adds a notification on top |

The server never reads these eagerly: a missing **optional** var (Cloudinary,
Resend) degrades that one feature rather than breaking `npm run build`; a
missing **required** var throws a clear error the first time something tries
to use it (`src/lib/env.ts`), not at build time.

### MongoDB setup

1. Create a free Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user with `readWrite` on the database named by
   `MONGODB_DB_NAME`.
3. Network access: for Vercel, either allow `0.0.0.0/0` (Atlas will flag this
   as a security risk — acceptable for serverless with no fixed egress IPs,
   but tighten it if Atlas's own [Vercel integration](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/)
   is available for your plan, since it manages IP access automatically) or
   use [Vercel's native Atlas integration](https://vercel.com/marketplace) if
   offered in your region.
4. Copy the `mongodb+srv://...` connection string into `MONGODB_URI` — both
   locally and in Vercel Project Settings → Environment Variables.
5. Indexes (unique email, status/date lookups) are created automatically on
   first write — no manual migration step.

### Google OAuth setup

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 Client ID (Application type: **Web application**).
2. Add these Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR-PRODUCTION-DOMAIN/api/auth/callback/google`
     (add this once the real domain is known — it is never hardcoded
     anywhere in this codebase)
3. Copy the Client ID and Client secret into `AUTH_GOOGLE_ID` and
   `AUTH_GOOGLE_SECRET`.
4. To make an account an admin, add its Google email to `ADMIN_EMAILS`
   (comma-separated) before or after it first signs in — the role is checked
   on every sign-in, so adding an email later promotes the existing account
   the next time it logs in.

### Admin credentials login

A second, independent way into `/admin` — a single fixed email/password
account at **`/admin/login`** — for the times signing in with Google isn't
practical. Google sign-in for `ADMIN_EMAILS` accounts still works exactly as
above; this is additive, not a replacement.

1. **Generate the password hash.** Run:

   ```bash
   node scripts/hash-admin-password.mjs
   ```

   It prompts for the password at a hidden, no-echo terminal prompt and
   prints a bcrypt hash. The password itself is never written to disk, never
   passed as a command-line argument (which would land in shell history),
   and never sent anywhere — only the resulting hash is printed, and only
   the hash gets stored anywhere.

2. **Add the variables locally.** In `.env.local`:

   ```
   ADMIN_LOGIN_EMAIL=admin@himalayasparsh.com
   ADMIN_LOGIN_PASSWORD_HASH=<the hash the script printed>
   ```

   Restart `next dev` afterward. Until `ADMIN_LOGIN_PASSWORD_HASH` is set,
   `/admin/login` rejects every attempt with the same generic error it always
   shows — it fails closed, not open.

3. **Add them to Vercel.** Project Settings → Environment Variables → add
   both `ADMIN_LOGIN_EMAIL` and `ADMIN_LOGIN_PASSWORD_HASH` (Production, and
   Preview if preview deploys need admin access too), then redeploy.

4. **Open `/admin/login`**, sign in with that email and password. On success
   it redirects to `/admin`. The same account is also just a normal row in
   the `users` collection — `role: "ADMIN"`, `isActive: true` — so everything
   in the admin panel (including user management) treats it identically to
   an admin who signed in with Google.

5. **To change the password later**, re-run
   `node scripts/hash-admin-password.mjs`, replace
   `ADMIN_LOGIN_PASSWORD_HASH` locally and in Vercel with the new hash, and
   redeploy. There's no "old password" to invalidate — the hash is the only
   thing that determines what's accepted, so replacing it is the whole
   rotation.

The real email and hash must never be committed: `.env.example` only ever
holds the variable names, and `.env.local` is gitignored.

### Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Copy Cloud name, API Key and API Secret from the dashboard into
   `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
3. No bucket/folder setup needed — `himalaya-sparsh/profiles`,
   `himalaya-sparsh/reviews` and `himalaya-sparsh/site` are created
   automatically on first upload to each.

### Deploying to Vercel

1. Add every variable above in Project Settings → Environment Variables (for
   Production, and again for Preview if you want preview deploys to have a
   working backend).
2. Set `NEXT_PUBLIC_SITE_URL` to the real `https://` domain, and register that
   domain's `/api/auth/callback/google` URL with Google (see above).
3. Redeploy after adding or changing environment variables — Vercel only
   picks them up on a new build.
4. MongoDB connections are cached per warm serverless instance
   (`src/lib/mongodb.ts`), so normal traffic does not open a new connection
   per request.

### What's implemented

- **Auth**: Auth.js v5 (`next-auth@beta`), two providers into the same
  `users` collection — Google OAuth (via the official MongoDB adapter,
  deduped by account) and a single fixed email/password admin account (via
  the Credentials provider, bcrypt-hashed, `/admin/login`). Sessions are JWT
  for both, with `role`/`isActive` re-read from Mongo on every request so a
  role change or deactivation takes effect immediately, not just next login.
- **Dashboard** (`/dashboard`): protected, shows the real signed-in profile,
  an editable phone/address form, a Cloudinary profile-photo uploader, and
  the user's own contact enquiries and reviews with live moderation status.
  No fake orders — there is no ordering backend yet.
- **Admin** (`/admin`): protected by `role === "ADMIN"` and `isActive`,
  independently re-checked in every server action (not just the page).
  Overview counts, contact-enquiry triage, review moderation (approve /
  reject / hide / delete / internal note), and user management (activate,
  deactivate, promote, demote — an admin can't lock themselves out).
- **Contact form** (`/contact`): posts to `/api/contact` — server-side Zod
  validation, honeypot, per-IP rate limiting, plain-text sanitization,
  persisted to MongoDB regardless of whether email is configured.
- **Reviews** (`/reviews`): signed-in users only can submit; new reviews are
  `PENDING` and invisible publicly until an admin approves them. Optional
  photo uploads (up to 4, JPEG/PNG/WebP, 5MB each) go through
  `/api/upload/review`, validated and stored server-side.
- **Rate limiting** is in-memory and per-process (`src/lib/rate-limit.ts`) —
  fine for a single warm instance, but not a durable multi-instance limit.
  For a guaranteed limit under real scale, swap in a durable store (e.g.
  Upstash Redis via the Vercel Marketplace); the call sites don't change.

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
| `public/images/logo.svg` | **Unused.** Wordmark reads "Himalaya Sparsh" — now the confirmed brand — but no component renders it yet |

### ⚠ The device render needs a clean re-export

`device-front.png` is the render the client supplied, cropped but otherwise
untouched. Its printed label carries several things the site cannot stand behind,
and they are legible at desktop reveal size:

- an **ISO certification badge** and two other certification-style marks, none of
  which we have evidence for;
- **"HIMALAYA SPARSH" / "The Living Water"** branding, printed on the render
  itself rather than added by the site;
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
