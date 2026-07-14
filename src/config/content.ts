/**
 * Single source of truth for every piece of copy, every asset path, every scroll
 * range and every commercial detail on the site. Components read from here and
 * nowhere else.
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
 * below is deliberately descriptive rather than functional for that reason: it
 * says what each material IS and WHERE it sits, and never what it does.
 */

export type ScrollRange = {
  /** Timeline position where the element starts fading in. */
  inStart: number;
  /** Timeline position where the element is fully visible. */
  inEnd: number;
  /** Timeline position where the element starts fading out. */
  outStart: number;
  /** Timeline position where the element is fully hidden. */
  outEnd: number;
};

/* ========================================================================== *
 * THE TIMELINE
 *
 * One timeline unit is one unit of `timelineLength`, and the pinned stage is
 * exactly `timelineLength` units long — so a range of 55–58 is always the same
 * slice of the scroll, at every breakpoint, however many benefits exist.
 *
 *    0 ──── 38 ─────── 53 ──────────── 85.4 ──── 88 ──── 103 ── 110
 *    │ glacier │ device │  layer walk   │ finale │  cta  │
 *
 * `timelineLength` grows when verified benefits are added (see BENEFIT_SPAN),
 * which lengthens the pin by the same proportion. Scroll *speed* therefore
 * stays constant no matter how much content lands.
 * ========================================================================== */

/** Timeline position at which the glacier footage reaches its final frame. */
const GLACIER_END = 38;

/** Where the internal layer walk begins, and how much scroll each layer owns. */
const LAYER_WALK_START = 53;
const LAYER_SPAN = 3.6;

/** Where the benefits act begins, and how much scroll one benefit card owns. */
const BENEFITS_START = 88;
const BENEFIT_SPAN = 6;

/* -------------------------------------------------------------------------- *
 * THE STACK INSIDE THE DEVICE
 *
 * Names and running order are taken from the manufacturer's own cutaway
 * diagram. `description` says what a material is and where it sits — nothing
 * more. `verifiedFunction` is what it *does*, and stays undefined until the
 * client supplies evidence; DeviceLayerCallout renders it only when it exists,
 * so filling it in is all that is needed to publish it.
 *
 * `anchor` is a point on the cutaway drawing in percent of its box, and must
 * match the geometry in DeviceCutaway.tsx — both are laid out against
 * `cutawayViewBox` below, so a change to one has to be a change to the other.
 * -------------------------------------------------------------------------- */

export type DeviceLayer = {
  id: string;
  name: string;
  /** Descriptive only: what it is, and where in the column it sits. */
  description: string;
  /**
   * What the material does. Rendered verbatim, so it may only be filled in with
   * wording that is verified AND non-medical. See the withheld-claims note at
   * the foot of this file.
   */
  verifiedFunction?: string;
  /** Where the above comes from: a lab report, a spec sheet, a supplier. */
  evidenceNote?: string;
  /** Point on the cutaway the connector line lands on, in % of its box. */
  anchor: { x: number; y: number };
  /** Which side of the cutaway the text sits on (lg and up). */
  side: "left" | "right";
  /** Timeline window this layer is the active one. Assigned below. */
  scrollRange: { start: number; end: number };
};

/** The cutaway drawing's coordinate space. DeviceCutaway.tsx draws into this. */
export const cutawayViewBox = { width: 240, height: 880 } as const;

type LayerSpec = Omit<DeviceLayer, "scrollRange">;

/**
 * Top to bottom, in the order the water meets them. The walk follows this array,
 * so reordering it reorders the scroll — no other file needs to change.
 */
const layerSpecs: LayerSpec[] = [
  {
    id: "funnel",
    name: "Funnel",
    description:
      "The opening at the top of the device. Water is poured in here and enters the column below.",
    anchor: { x: 50, y: 7.5 },
    side: "right",
  },
  {
    id: "himalayan-stones",
    name: "Himalayan stones",
    description:
      "A bed of stones associated with the Himalayan landscape, and the first material the water meets.",
    anchor: { x: 50, y: 18.5 },
    side: "right",
  },
  {
    id: "japanese-stones",
    name: "Japanese stones",
    description:
      "A second stone bed, packed directly beneath the Himalayan layer.",
    anchor: { x: 50, y: 26 },
    side: "right",
  },
  {
    id: "jamun-wood",
    name: "Jamun wood",
    description:
      "Jamun wood — the timber of the Indian blackberry tree — filling the chamber at the middle of the column.",
    anchor: { x: 41.7, y: 34.1 },
    side: "right",
  },
  {
    id: "silver",
    name: "Silver",
    description:
      "Silver, or chandi, set into the same chamber as the jamun wood.",
    anchor: { x: 58.3, y: 40.9 },
    side: "right",
  },
  {
    id: "magnesium",
    name: "Magnesium",
    description: "Magnesium, held in the chamber below the wood and the silver.",
    anchor: { x: 50, y: 49.9 },
    side: "right",
  },
  {
    id: "magnet",
    name: "Magnet",
    description:
      "A magnet seated across the full width of the column, on the path the water takes downward.",
    anchor: { x: 50, y: 55.1 },
    side: "right",
  },
  {
    id: "korean-media",
    name: "Korean media stones",
    description:
      "A packed bed of ceramic media stones — the deepest chamber in the column.",
    anchor: { x: 50, y: 64.8 },
    side: "right",
  },
  {
    id: "zinc",
    name: "Zinc",
    description:
      "Zinc. The last material the water passes before it reaches the outlet.",
    anchor: { x: 50, y: 79.4 },
    side: "right",
  },
];

/** The nine layers, each given its own slice of the walk, in order. */
export const deviceLayers: DeviceLayer[] = layerSpecs.map((spec, index) => {
  const start = LAYER_WALK_START + index * LAYER_SPAN;
  return { ...spec, scrollRange: { start, end: start + LAYER_SPAN } };
});

/** Timeline position at which the last layer has finished. */
const LAYER_WALK_END = LAYER_WALK_START + layerSpecs.length * LAYER_SPAN;

/* -------------------------------------------------------------------------- *
 * BENEFITS
 *
 * `verifiedBenefits` IS EMPTY ON PURPOSE, and the benefits act therefore
 * consumes no scroll at all — the journey runs straight from the layer walk to
 * the water finale, and BenefitsSequence renders nothing.
 *
 * Five claims arrived with the client's reference artwork. Every one of them is
 * withheld:
 *
 *   "Regulates blood sugar levels"   — medical claim. Blocked.
 *   "Enhances insulin sensitivity"   — medical claim. Blocked.
 *   "Improves digestion"             — medical claim. Blocked.
 *   "Aids weight management"         — medical claim. Blocked.
 *   "Rich in nutrients"              — mineral-content claim; needs a lab report
 *                                      naming the minerals and their quantities.
 *
 * To publish a benefit: add an entry below with wording that is verified and
 * non-medical. Its scroll window, the finale, the CTA and the length of the pin
 * all move to accommodate it automatically.
 * -------------------------------------------------------------------------- */

export type Benefit = {
  id: string;
  title: string;
  description: string;
  /** Where the evidence comes from. Rendered under the card when present. */
  evidenceNote?: string;
  range: ScrollRange;
};

type BenefitSpec = Omit<Benefit, "range">;

const verifiedBenefits: BenefitSpec[] = [];

export const benefits: Benefit[] = verifiedBenefits.map((spec, index) => {
  const start = BENEFITS_START + index * BENEFIT_SPAN;
  return {
    ...spec,
    range: {
      inStart: start,
      inEnd: start + 2,
      outStart: start + 4.5,
      outEnd: start + BENEFIT_SPAN,
    },
  };
});

/** Where the benefits act ends — equal to its start while there are none. */
const BENEFITS_END = BENEFITS_START + verifiedBenefits.length * BENEFIT_SPAN;

/* -------------------------------------------------------------------------- *
 * THE FINALE'S OWN TIMING
 *
 * Broken into named spans, rather than one hand-tuned range, because the pour
 * and the fill are not decorative — they are the two things this scene exists
 * to show in order: the stream arrives, THEN the glass rises, and only once it
 * is visibly full does the scene hand off to the CTA. Collapsing any of this
 * back into a single `range` is what previously let the exit start while the
 * glass was still mid-fill.
 * -------------------------------------------------------------------------- */

/** How long the copy and device take to settle before the pour begins. */
const FINALE_SETTLE_SPAN = 5;

/** How long the stream takes to visibly cross from the outlet into the glass. */
const FINALE_POUR_SPAN = 2;

/**
 * How much scroll it takes the glass to fill, once the stream has arrived.
 * Scrubbed at `ease: "none"` in GlacierExperience, so the water level is a
 * direct, one-to-one function of scroll position — in both directions.
 */
const FINALE_FILL_SPAN = 6;

/** How long the full glass holds before the scene starts to leave. */
const FINALE_FILL_HOLD = 1;

/** How long the finale takes to fade out once it starts leaving. */
const FINALE_EXIT_SPAN = 3;

/** How long the CTA takes to fade in, once the finale starts its exit. */
const CTA_SPAN = 5;

// The pour begins a beat before the copy has fully settled — exactly as the
// device settled a beat before its own copy did in the scene before this one.
const FINALE_POUR_START = BENEFITS_END + FINALE_SETTLE_SPAN - 1;
const FINALE_POUR_END = FINALE_POUR_START + FINALE_POUR_SPAN;
const FINALE_FILL_END = FINALE_POUR_END + FINALE_FILL_SPAN;
const FINALE_OUT_START = FINALE_FILL_END + FINALE_FILL_HOLD;
const FINALE_OUT_END = FINALE_OUT_START + FINALE_EXIT_SPAN;

// The CTA overlaps the finale's own exit by design — the same cross-fade
// every other scene boundary on this page uses — but never starts before the
// glass has been sitting full for a whole `FINALE_FILL_HOLD` unit.
const CTA_IN_START = FINALE_OUT_START + 2;

/**
 * Total length of the pinned timeline. Grows with the benefits, and the pin
 * grows with it, so adding a card never speeds anything else up.
 */
export const timelineLength = CTA_IN_START + CTA_SPAN + 2;

/**
 * Length of the pin, as multiples of the viewport height, before the timeline's
 * own length is applied. Mobile is shorter: the same beats, less travel.
 */
export const scrollViewports = { desktop: 11, mobile: 8 } as const;

/* -------------------------------------------------------------------------- *
 * The frame sequence.
 * -------------------------------------------------------------------------- */

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

/**
 * The footage is mapped onto the *glacier* portion of the timeline rather than
 * the whole thing: it reaches its last frame exactly as the device arrives, and
 * holds there behind the device and the cutaway for the rest of the scroll. Were
 * it stretched across the full pin, the journey would crawl and most of the
 * paints would land behind an opaque backdrop.
 */
export const sequence = { end: GLACIER_END } as const;

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
    range: { inStart: 0, inEnd: 0, outStart: 5, outEnd: 8 } satisfies ScrollRange,
  },

  /** Scene 2 — the glacier and the natural water source. */
  source: {
    eyebrow: "The Source",
    heading: "Where the water begins",
    body: "High above the treeline, glacier ice gives up its water slowly. It moves through rock and gravel for a long time before it reaches anything built by people. That landscape is where this story starts.",
    range: { inStart: 8, inEnd: 12, outStart: 16, outEnd: 19 } satisfies ScrollRange,
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
    range: { inStart: 19, inEnd: 23, outStart: 27, outEnd: 30 } satisfies ScrollRange,
  },

  /** Scene 4 — the water turns toward the device. */
  descent: {
    eyebrow: "The Descent",
    heading: "From the valley to your home",
    body: "What the mountain does slowly, across rock and time, this device is made to bring indoors.",
    range: { inStart: 30, inEnd: 33, outStart: 35, outEnd: 38 } satisfies ScrollRange,
  },

  /**
   * Scene 5 — the device, seen from outside.
   *
   * It rises, settles, drifts, and then dissolves into the cutaway. The layer
   * only fades; the depth is a separate transform on a separate element, so the
   * whole scene can be handed to the compositor.
   */
  device: {
    range: { inStart: 36, inEnd: 44, outStart: 48, outEnd: 53 } satisfies ScrollRange,

    intro: {
      eyebrow: "The Device",
      heading: product.name,
      body: "A water-conversion experience inspired by the Himalayan landscape. Designed to bring the story of Himalayan stones into the home.",
      range: { inStart: 38, inEnd: 43, outStart: 46, outEnd: 49 } satisfies ScrollRange,
    },

    /** Alt text for the device render. Describes it; claims nothing about it. */
    imageAlt:
      "The water converter device: a copper vessel seated on a cylindrical body, shown from the front",
  },

  /**
   * Scene 6 — how the device works: the cutaway and the nine-layer walk.
   *
   * `range` is the whole layer. The walk itself runs from LAYER_WALK_START to
   * LAYER_WALK_END and is driven entirely by `deviceLayers` above.
   */
  howItWorks: {
    eyebrow: "How it works",
    heading: "Inside the column",
    body: "Water enters at the funnel and passes down through a stack of stone, metal and wood before it reaches the outlet. Keep scrolling to follow it down.",

    /**
     * Shown in small print beneath the walk. It is the honest version of what we
     * can currently say, and it is what keeps the section publishable: we are
     * describing a build, not making a claim about it.
     */
    sourceNote:
      "Composition as specified by the manufacturer. What each material does is not described here until independent test results are available.",

    /** Describes the drawing for screen readers and for search engines. */
    cutawayAlt:
      "Cutaway diagram of the water converter: a funnel at the top feeding a column packed, from top to bottom, with Himalayan stones, Japanese stones, jamun wood and silver, magnesium, a magnet, Korean media stones and zinc, above the outlet.",

    range: {
      inStart: 48,
      inEnd: 54,
      outStart: LAYER_WALK_END,
      outEnd: LAYER_WALK_END + 3.6,
    } satisfies ScrollRange,

    /** The walk itself. The water stream is scrubbed across exactly this window. */
    walk: { start: LAYER_WALK_START, end: LAYER_WALK_END },

    /** The heading block beside the cutaway; it holds for the whole walk. */
    headingRange: {
      inStart: 49,
      inEnd: 53,
      outStart: LAYER_WALK_END,
      outEnd: LAYER_WALK_END + 3,
    } satisfies ScrollRange,
  },

  /**
   * Scene 8 — the finale: water leaving the device and filling a glass.
   *
   * No pH figure, no mineral count, no "before and after" — the client has
   * supplied no test results, so the shot is the water and nothing else.
   *
   * Three beats, in order, each with its own window: the stream **pours**
   * from the outlet to the glass; the level inside the glass then **fills**,
   * scrubbed one-to-one with scroll; only once it has held full for
   * `FINALE_FILL_HOLD` units does the scene's own `range.outStart` arrive and
   * the CTA begin its cross-fade in.
   */
  finale: {
    eyebrow: "The result",
    heading: "Water, poured",
    body: "The water leaves the column and fills the glass. What it is like when it gets there will be described here once it has been measured.",
    glassAlt: "A glass filling with water poured from the device",
    range: {
      inStart: BENEFITS_END,
      inEnd: BENEFITS_END + FINALE_SETTLE_SPAN,
      outStart: FINALE_OUT_START,
      outEnd: FINALE_OUT_END,
    } satisfies ScrollRange,

    /** The stream's own window: begins just before the copy settles, and has
     * visibly reached the glass by the time this ends. */
    pour: { start: FINALE_POUR_START, end: FINALE_POUR_END },

    /** The glass's fill level: begins the instant the stream arrives, and is
     * fully poured — one-to-one with scroll — by the time this ends. */
    fill: { start: FINALE_POUR_END, end: FINALE_FILL_END },
  },

  /** Scene 9 — enquiry / purchase. */
  cta: {
    eyebrow: "Bring the mountain home",
    heading: product.name,
    body: "Discover the device, its materials and its water journey.",
    buyLabel: "Buy now",
    whatsappLabel: "Enquire on WhatsApp",
    whatsappMessage: `Hi, I'd like to enquire about the ${product.name}.`,
    /** No exit: the CTA is the last thing on the page and must stay on screen. */
    range: {
      inStart: CTA_IN_START,
      inEnd: CTA_IN_START + CTA_SPAN,
      outStart: timelineLength,
      outEnd: timelineLength,
    } satisfies ScrollRange,
  },
} as const;

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
    "A scroll-driven Himalayan water-converter experience: from the glacier, through the landscape the Gonbo Rangjon stones are associated with, into the device and down through the column.",
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
