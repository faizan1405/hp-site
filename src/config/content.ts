/**
 * Single source of truth for every piece of copy, every asset path and every
 * commercial detail on the site. Components read from here and nowhere else.
 *
 * ---------------------------------------------------------------------------
 * THE NULL RULE
 * ---------------------------------------------------------------------------
 * Anything the client has not verified yet is `null` or an empty array — never
 * a stand-in like "₹—", "example.com" or a made-up phone number. Every
 * component is written to HIDE its element when the value behind it is missing,
 * so an unset price renders no price at all and an unset buy URL renders no
 * button. Fill a value in here and the UI appears on its own.
 *
 * Nothing on this site may state or imply a medical, mineral, pH, purification
 * or certification claim until the client supplies evidence for it. The copy
 * below is deliberately descriptive rather than functional for that reason.
 */

export type ScrollRange = {
  /** Timeline position (0–100) where the element starts fading in. */
  inStart: number;
  /** Timeline position (0–100) where the element is fully visible. */
  inEnd: number;
  /** Timeline position (0–100) where the element starts fading out. */
  outStart: number;
  /** Timeline position (0–100) where the element is fully hidden. */
  outEnd: number;
};

export type Benefit = {
  id: string;
  title: string;
  description: string;
  range: ScrollRange;
};

/**
 * One stone or component inside the device, called out beside the device render
 * as the visitor scrolls. The public page shows these only when `deviceElements`
 * below actually contains items, so an empty list ships an empty list — never a
 * placeholder card.
 */
export type DeviceElement = {
  id: string;
  name: string;
  shortDescription: string;
  /**
   * What the element does. Leave undefined until the client supplies wording
   * that is both verified and non-medical — this string is rendered verbatim.
   */
  verifiedFunction?: string;
  /** Where the above comes from: a lab report, a spec sheet, a supplier. */
  evidenceNote?: string;
  /** Optional close-up of the stone itself. */
  image?: string;
  /** Point on the device image the connector line targets, in % of its box. */
  anchor?: { x: number; y: number };
  /** Which side of the device the text sits on. Defaults to "left". */
  side?: "left" | "right";
  /** Timeline window (0–100) this callout occupies. One element at a time. */
  scrollRange: { start: number; end: number };
};

/**
 * One rendition of the glacier journey, exploded into still frames.
 *
 * The pinned experience does not play a video: it draws one of these frames into
 * a canvas per animation frame, indexed straight off scroll progress. That is the
 * only way to get frame-accurate, instantly-reversible scrubbing — a `<video>`
 * element throttles and coalesces `currentTime` seeks, which is what made fast
 * and reverse scrolling stutter.
 */
export type FrameSet = {
  /** Directory the frames live in, without a trailing slash. */
  path: string;
  /** How many frames it contains. Files are `frame-0001.webp` … `frame-NNNN.webp`. */
  count: number;
  /** Intrinsic pixel size of every frame. Used for the object-cover maths. */
  width: number;
  height: number;
};

/**
 * Generated from `public/videos/glacier-journey.mp4` (1280×720, 30fps, 8.4s) with
 * `scripts/extract-frames.mjs`. Re-run that script if the footage changes and
 * update the counts below to match what it prints.
 *
 * Desktop is the source's native resolution. Mobile is half-weight: fewer frames
 * (a phone scrolls a shorter pin) at a smaller size, which keeps the whole set
 * under 2 MB.
 */
export const frames = {
  desktop: {
    path: "/frames/desktop",
    count: 180,
    width: 1280,
    height: 720,
  },
  mobile: {
    path: "/frames/mobile",
    count: 96,
    width: 768,
    height: 432,
  },
} as const satisfies Record<"desktop" | "mobile", FrameSet>;

export const assets = {
  /**
   * Kept for the two fallback paths only — the `lite` mode loop and the OG image.
   * The scrubbed experience reads `frames` above and never touches this file.
   */
  video: "/videos/glacier-journey.mp4",
  poster: "/images/video-poster.jpg",
  /**
   * Lossless tight crop of the render supplied by the client
   * ("ChatGPT Image Jul 13, 2026, 07_00_43 PM.png", which is kept unmodified
   * alongside it). Cropping only removed fully transparent margin — no pixel of
   * the device was resampled or retouched.
   *
   * TODO(client): this render's label carries garbled text and an ISO-style
   * certification badge that we cannot substantiate. It needs a clean re-export
   * before launch. See README.
   */
  device: "/images/device-front.png",
  /** Alpha silhouette of the same render. Clips the light sweep to the device. */
  deviceMask: "/images/device-mask.png",
  /**
   * TODO(client): `logo.svg` still reads "Himalaya Sparsh", which is not the
   * confirmed brand. Nothing renders a logo while this is null — set the path
   * once a correct wordmark exists and it appears everywhere at once.
   */
  logo: null as string | null,
} as const;

/** Intrinsic size of `assets.device`. Reserves the right box so nothing shifts. */
export const deviceImage = { width: 424, height: 1330 } as const;

export const brand = {
  /** TODO(client): final brand name. */
  name: null as string | null,
  /** TODO(client): final tagline. */
  tagline: null as string | null,
} as const;

/**
 * Neutral, accurate naming used until the client confirms the brand. Safe to
 * show: it describes what the product is rather than claiming what it does.
 */
export const product = {
  name: "Himalayan Water Converter",
  descriptor: "Water Converter Device",
} as const;

/** What the page calls itself when there is no confirmed brand name yet. */
export const siteName: string = brand.name ?? product.name;

export const scenes = {
  /** Scene 1 — the summit. */
  opening: {
    headline: "Born from the Himalaya",
    instruction: "Scroll to discover",
    range: { inStart: 0, inEnd: 0, outStart: 9, outEnd: 13 } satisfies ScrollRange,
  },

  /** Scene 2 — the glacier and the natural water source. */
  source: {
    eyebrow: "The Source",
    heading: "Where the water begins",
    body: "High above the treeline, glacier ice gives up its water slowly. It moves through rock and gravel for a long time before it reaches anything built by people. That landscape is where this story starts.",
    range: { inStart: 13, inEnd: 18, outStart: 26, outEnd: 30 } satisfies ScrollRange,
  },

  /**
   * Scene 3 — the Gonbo Rangjon origin story.
   *
   * Written to describe an association with the landscape and nothing more. It
   * must never imply that the mountain, or any religious or government body,
   * endorses or is connected to the product.
   */
  origin: {
    eyebrow: "Gonbo Rangjon",
    heading: "The mountain the stones are named for",
    body: "Gonbo Rangjon stands alone above the Zanskar valley in Ladakh, and the people who live beneath it have held it sacred for generations. The stones this device is built around are associated with that landscape. The mountain lends the story its name — no more than that.",
    range: { inStart: 30, inEnd: 35, outStart: 43, outEnd: 47 } satisfies ScrollRange,
  },

  /** Scene 4 — the water turns toward the device. */
  descent: {
    eyebrow: "The Descent",
    heading: "From the valley to your home",
    body: "What the mountain does slowly, across rock and time, this device is made to bring indoors.",
    range: { inStart: 47, inEnd: 51, outStart: 55, outEnd: 58 } satisfies ScrollRange,
  },

  /**
   * Scene 5 — the device.
   *
   * `range` is the whole layer: the device rises at 58, holds and drifts while
   * the two copy blocks cross-fade beside it, then leaves at 92. The copy blocks
   * share one grid cell, so swapping them costs no layout shift.
   */
  device: {
    range: { inStart: 58, inEnd: 68, outStart: 88, outEnd: 92 } satisfies ScrollRange,

    intro: {
      eyebrow: "The Device",
      heading: product.name,
      body: "A water-conversion experience inspired by the Himalayan landscape. Designed to bring the story of Himalayan stones into the home.",
      range: { inStart: 60, inEnd: 67, outStart: 71, outEnd: 74 } satisfies ScrollRange,
    },

    /** The internal stone / conversion concept — stated without a mechanism. */
    conversion: {
      eyebrow: "Inside",
      heading: "The stones at its centre",
      body: "Water passes through a chamber of stones drawn from the Himalayan landscape. The stones themselves, their materials and the part each one plays are being documented, and will be described here once that information is confirmed.",
      range: { inStart: 74, inEnd: 78, outStart: 86, outEnd: 90 } satisfies ScrollRange,
    },

    /** Alt text for the device render. Describes it; claims nothing about it. */
    imageAlt:
      "The water converter device: a copper vessel seated on a cylindrical body, shown from the front",
  },

  /**
   * Scene 6 — product benefits.
   *
   * Intentionally empty. Benefits may only be written once the client supplies
   * verified, non-medical wording; until then the journey runs straight from the
   * device to the call to action and no card renders.
   *
   * When they arrive: give them a window inside the device hold (68–88) or raise
   * SCROLL_VIEWPORTS in GlacierExperience to buy more room.
   */
  benefits: [] as Benefit[],

  /** Scene 7 — enquiry / purchase. */
  cta: {
    eyebrow: "Bring the mountain home",
    heading: product.name,
    body: "Discover the device, its materials and its water journey.",
    buyLabel: "Buy now",
    whatsappLabel: "Enquire on WhatsApp",
    whatsappMessage: `Hi, I'd like to enquire about the ${product.name}.`,
    /** No exit: the CTA is the last thing on the page and must stay on screen. */
    range: { inStart: 92, inEnd: 98, outStart: 100, outEnd: 100 } satisfies ScrollRange,
  },
} as const;

/* -------------------------------------------------------------------------- *
 * The stones inside the device.
 *
 * Ships empty on purpose. The callout system in DeviceCallout.tsx is finished
 * and reusable — drop the client's verified stones in here, each with an anchor
 * point and a scroll window, and they will appear one at a time beside the
 * device with a connector line. Nothing renders while the list is empty.
 * -------------------------------------------------------------------------- */
export const deviceElements: DeviceElement[] = [];

/**
 * Development-only. Lets us exercise the callout system without inventing stone
 * names on the public site: every string below is visibly a placeholder, and the
 * list is only used when NEXT_PUBLIC_PREVIEW_ELEMENTS=1, which is never set in
 * production. It also documents the shape the real data should take.
 */
export const devPreviewElements: DeviceElement[] = [
  {
    id: "placeholder-1",
    name: "PLACEHOLDER — stone one",
    shortDescription:
      "Example callout copy. Replace with the client's verified description.",
    verifiedFunction: "Example function — only fill this in once it is verified.",
    evidenceNote: "Source: to be supplied",
    anchor: { x: 50, y: 18 },
    side: "left",
    scrollRange: { start: 76, end: 80 },
  },
  {
    id: "placeholder-2",
    name: "PLACEHOLDER — stone two",
    shortDescription:
      "Example callout copy. Replace with the client's verified description.",
    anchor: { x: 50, y: 48 },
    side: "right",
    scrollRange: { start: 80, end: 84 },
  },
  {
    id: "placeholder-3",
    name: "PLACEHOLDER — stone three",
    shortDescription:
      "Example callout copy. Replace with the client's verified description.",
    anchor: { x: 50, y: 76 },
    side: "left",
    scrollRange: { start: 84, end: 88 },
  },
];

/** Empty in every real build; the preview list only when the flag is set. */
export const activeDeviceElements: DeviceElement[] =
  process.env.NEXT_PUBLIC_PREVIEW_ELEMENTS === "1"
    ? devPreviewElements
    : deviceElements;

/* -------------------------------------------------------------------------- *
 * Commerce, people and contact details.
 *
 * Every field is null until the client supplies it. See "THE NULL RULE" above:
 * the buttons, the price and the address block do not exist until they do.
 * -------------------------------------------------------------------------- */

export const commerce = {
  /** TODO(client): display string, e.g. "₹12,500". */
  price: null as string | null,
  /** TODO(client): e.g. "Inclusive of taxes". */
  priceNote: null as string | null,
  /** TODO(client): the Buy button's destination. Hidden while null. */
  buyUrl: null as string | null,
  /** TODO(client): international format, digits only, e.g. "919876543210". */
  whatsappNumber: null as string | null,
  whatsappMessage: scenes.cta.whatsappMessage,
} as const;

export const founder = {
  /** TODO(client): founder name, role, story and portrait. */
  name: null as string | null,
  role: null as string | null,
  story: null as string | null,
  image: null as string | null,
} as const;

export const delivery = {
  /** TODO(client): e.g. "Ships across India in 5–7 days". */
  headline: null as string | null,
  /** TODO(client): shipping, returns and warranty lines. */
  points: [] as string[],
} as const;

export const socialProof = {
  /** TODO(client): only real, attributable figures. */
  rating: null as number | null,
  reviewCount: null as number | null,
  quotes: [] as { id: string; quote: string; author: string }[],
} as const;

export const contact = {
  /** TODO(client): a real inbox, phone and address. */
  email: null as string | null,
  phone: null as string | null,
  address: null as string | null,
} as const;

export const seo = {
  title: `${product.name} — a scroll-driven Himalayan journey`,
  description:
    "A scroll-driven Himalayan water-converter experience: from the glacier, through the landscape the Gonbo Rangjon stones are associated with, to the device itself.",
  keywords: [
    "Himalayan water converter",
    "water converter device",
    "Gonbo Rangjon",
    "Zanskar",
    "Ladakh",
  ],
  /**
   * TODO(client): the final domain. Set NEXT_PUBLIC_SITE_URL to it — canonical
   * and Open Graph URLs follow automatically. Falls back to localhost so the
   * build neither warns nor ships a made-up domain.
   */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
} as const;

/** The WhatsApp deep link — null while there is no number to send it to. */
export const whatsappHref: string | null = commerce.whatsappNumber
  ? `https://wa.me/${commerce.whatsappNumber}?text=${encodeURIComponent(
      commerce.whatsappMessage,
    )}`
  : null;

/** True when the CTA has at least one thing a visitor can actually press. */
export const hasPurchaseAction: boolean = Boolean(
  commerce.buyUrl || whatsappHref,
);

/** Scroll distance of the pinned experience, per breakpoint. */
export const scrollDistance = {
  desktop: "600vh",
  mobile: "450vh",
} as const;
