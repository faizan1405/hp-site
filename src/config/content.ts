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
  sourceNote?: string;
  /**
   * How solid that source is — "lab verification required" is not the same
   * claim as "established general use". Rendered as a small qualifier next to
   * `sourceNote`, never on its own as a badge that could read as a pass/fail.
   */
  verificationStatus?: string;
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
 *
 * `description` and `verifiedFunction` are the client's own revised copy — each
 * a two-sentence brief split at its natural sentence boundary: the first
 * sentence (what the layer *is*) becomes `description`, the second (what it is
 * designed or intended to do) becomes `verifiedFunction`. Kept verbatim,
 * including British spelling and the client's own apostrophes — this is their
 * copy, not a paraphrase of it.
 *
 * `sourceNote` and `verificationStatus` were supplied earlier, against the
 * client's original product PDF, and are unchanged here: the marketing pass
 * that produced this wording did not revisit which claims are lab-confirmed
 * versus merely documented, so the evidentiary status of each material is
 * exactly what it was before this copy was polished.
 *
 * None of the nine contains a diabetes, blood-sugar, digestion-treatment,
 * blood-pressure, detox or immunity claim, an exact pH value, or an exact
 * mineral quantity — the boundaries set for this content. Several (Himalayan,
 * Japanese and Korean stones in particular) are less hedged than the wording
 * they replace, which no longer carries an inline "requires laboratory
 * confirmation" clause of its own; `verificationStatus` is where that caveat
 * now lives instead.
 */
const layerSpecs: LayerSpec[] = [
  {
    id: "funnel",
    name: "Funnel",
    description:
      "A wide-entry funnel that guides water smoothly into the device and distributes it evenly across the first media layer.",
    verifiedFunction:
      "This helps maintain a steady flow and allows the water to make better contact with the materials inside the treatment column.",
    sourceNote: "Mechanical function based on the supplied device design.",
    verificationStatus: "mechanical",
    anchor: { x: 50, y: 7.5 },
    side: "right",
  },
  {
    id: "himalayan-stones",
    name: "Himalayan stones",
    description:
      "Natural Himalayan stone media that brings water into contact with a variety of naturally occurring minerals.",
    verifiedFunction:
      "This layer is designed to support the water’s mineral character and contribute to a clean, balanced and refreshing taste.",
    sourceNote: "Client-provided product PDF, pages 3–5.",
    verificationStatus: "client-documented; lab verification required",
    anchor: { x: 50, y: 18.5 },
    side: "right",
  },
  {
    id: "japanese-stones",
    name: "Japanese stones",
    description:
      "Japanese vanadium alkaline stones used as a specialised mineral-conditioning layer.",
    verifiedFunction:
      "As water passes through them, they are intended to support mineral interaction and help create a smoother, more balanced drinking experience.",
    sourceNote: "Client-provided product PDF, pages 9–10.",
    verificationStatus: "client-documented; lab verification required",
    anchor: { x: 50, y: 26 },
    side: "right",
  },
  {
    id: "jamun-wood",
    name: "Jamun wood",
    description:
      "Natural Jamun wood traditionally valued for its use in water-storage and water-contact applications.",
    verifiedFunction:
      "This layer is intended to help maintain freshness, minimise unpleasant odours and add a natural element to the device’s treatment process.",
    sourceNote: "Client-provided product PDF, pages 15–16.",
    verificationStatus: "traditional-use claim; further verification required",
    anchor: { x: 41.7, y: 34.1 },
    side: "right",
  },
  {
    id: "silver",
    name: "Silver",
    description: "A silver-based media layer incorporated into the water-treatment column.",
    verifiedFunction:
      "Silver is commonly used in water systems to help limit unwanted microbial growth, supporting cleaner and fresher water as it travels through the device.",
    sourceNote: "Client-provided product PDF, pages 13–14.",
    verificationStatus: "established general use; product testing required",
    anchor: { x: 58.3, y: 40.9 },
    side: "right",
  },
  {
    id: "magnesium",
    name: "Magnesium",
    description:
      "A magnesium-based mineral media layer designed to bring water into contact with an important natural mineral.",
    verifiedFunction:
      "It supports the device’s mineral-conditioning process and is intended to contribute to a more balanced water profile.",
    sourceNote: "Client-provided product PDF, pages 21–22.",
    verificationStatus: "lab verification required",
    anchor: { x: 50, y: 49.9 },
    side: "right",
  },
  {
    id: "magnet",
    name: "Magnet",
    description:
      "A magnetic stage that exposes flowing water to a controlled magnetic field as it moves through the device.",
    verifiedFunction:
      "It serves as an additional water-conditioning step without changing the natural appearance or flow of the water.",
    sourceNote: "Client-provided product PDF, pages 23–24.",
    verificationStatus: "limited evidence",
    anchor: { x: 50, y: 55.1 },
    side: "right",
  },
  {
    id: "korean-media",
    name: "Korean media stones",
    description:
      "Korean alkaline mineral stones that form one of the device’s main mineral-contact layers.",
    verifiedFunction:
      "They are intended to support water conditioning, mineral interaction and a smoother, more refreshing taste.",
    sourceNote: "Client-provided product PDF, pages 6–8.",
    verificationStatus: "client-documented; lab verification required",
    anchor: { x: 50, y: 64.8 },
    side: "right",
  },
  {
    id: "zinc",
    name: "Zinc",
    description:
      "A zinc-based trace-mineral media layer positioned near the final stage of the treatment column.",
    verifiedFunction:
      "It provides an additional mineral-contact step and supports the device’s overall water-conditioning process before the water exits.",
    sourceNote: "Client-provided product PDF, pages 17–18.",
    verificationStatus: "lab verification required",
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
   * `logo.svg` is a wordmark reading "Himalaya Sparsh" — now the confirmed
   * brand. No component reads `assets.logo` yet; the nav and headings render
   * `product.descriptor` as text instead. Set this AND wire it into a
   * component if the site should show the mark image rather than text.
   */
  logo: null as string | null,
} as const;

/** Intrinsic size of `assets.device`. Reserves the right box so nothing shifts. */
export const deviceImage = { width: 424, height: 1330 } as const;

export const brand = {
  /** Confirmed by the client. */
  name: "Himalaya Sparsh" as string | null,
  /** TODO(client): final tagline. */
  tagline: null as string | null,
} as const;

/** The client's confirmed brand and product name — the same name for both. */
export const product = {
  name: "Himalaya Sparsh",
  descriptor: "Himalaya Sparsh",
} as const;

/** What the page calls itself. Falls back to `product.name` if `brand.name` is ever unset again. */
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
      "Himalaya Sparsh: a copper vessel seated on a cylindrical body, shown from the front",
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
      "Cutaway diagram of Himalaya Sparsh: a funnel at the top feeding a column packed, from top to bottom, with Himalayan stones, Japanese stones, jamun wood and silver, magnesium, a magnet, Korean media stones and zinc, above the outlet.",

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
    glassAlt: "A glass filling with water poured from Himalaya Sparsh",
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
    body: "Discover Himalaya Sparsh, its materials and its water journey.",
    buyLabel: "Buy now",
    whatsappLabel: "Enquire on WhatsApp",
    whatsappMessage: `Hi, I'd like to enquire about ${product.name}.`,
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

/**
 * The "Buy Now" button's own WhatsApp order flow: a confirmed number and a
 * pre-written enquiry message supplied by the client. Kept separate from
 * `commerce.whatsappNumber` above, which is a different, still-unconfirmed
 * general enquiry line — this one is real and always renders.
 */
export const buyNowWhatsapp = {
  /** International format, digits only. */
  number: "917095007500",
  message:
    "Hello Himalaya Sparsh, I am interested in buying Himalaya Sparsh. Please share the price, delivery details, and ordering process.",
  label: "Buy Now on WhatsApp",
} as const;

/** The deep link the "Buy Now" button opens, in a new tab. */
export const buyNowWhatsappHref = `https://wa.me/${buyNowWhatsapp.number}?text=${encodeURIComponent(
  buyNowWhatsapp.message,
)}`;

export const founder = {
  /** Confirmed by the client. */
  name: "Arveen Maan" as string | null,
  /** Confirmed by the client. */
  role: "Founder & CEO" as string | null,
  /**
   * The founder's own note, supplied verbatim by the client and rendered on the
   * `/leadership` page as separate paragraphs. Kept as an array so the page can
   * space each paragraph without splitting a single string at render time.
   */
  story: [
    "At Himalaya Sparsh™, leadership begins with purpose.",
    "From the very beginning, my vision has been to build more than a product—I believe that meaningful innovation is born when nature, science, and thoughtful design come together to solve everyday challenges.",
    "This journey has been driven by curiosity, continuous learning, and an unwavering commitment to quality. Every decision we make is guided by a simple principle: if we are going to create something that becomes part of people's daily lives, it must be crafted with integrity, precision, and care.",
    "Leadership, to me, is about setting a clear vision while empowering a team to pursue excellence with passion and accountability. It means embracing innovation without losing sight of responsibility, listening to our customers, and constantly striving to improve every aspect of what we do.",
    "As Himalaya Sparsh continues to grow, our commitment remains unchanged—to build a globally respected Indian brand that represents quality, trust, innovation, and exceptional craftsmanship. We aspire to deliver experiences that reflect the purity of nature while meeting the expectations of modern lifestyles.",
    "I sincerely thank our customers, partners, and supporters for placing their trust in Himalaya Sparsh. Your confidence motivates us to continue innovating and raising the standard of premium hydration.",
    "Together, we are building more than a product—we are shaping the future of premium hydration.",
  ] as string[],
  /**
   * TODO(client): a founder portrait. Null renders an elegant monogram
   * placeholder on the leadership page instead — drop a path in here and the
   * page shows the real photograph with no other change.
   */
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
  email: "info.himalayasparsh@gmail.com" as string | null,
  phone: "7095007500" as string | null,
  address: "B. No. 962, Sector 28, Gurugram, Haryana – 122022" as string | null,
  hours: "Open 24/7" as string | null,
} as const;

/**
 * The `/about` page's own WhatsApp link. Kept separate from `commerce`, which
 * still has no confirmed enquiry number — filling that one in would also turn
 * on the homepage's purchase-flow WhatsApp button, which is not this page's
 * call to make.
 */
export const aboutWhatsappHref: string | null = contact.phone
  ? `https://wa.me/91${contact.phone}?text=${encodeURIComponent(
      "Hi, I'd like to know more about Himalaya Sparsh.",
    )}`
  : null;

/**
 * The site's persistent top navigation. "How It Works" points at the homepage
 * itself — the scroll journey IS the explanation of how the device works — so it
 * is not a duplicate route but a labelled entry into the same experience. Every
 * other item is its own standalone page, kept out of the pinned timeline.
 */
export const nav = {
  links: [
    { label: "How It Works", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Leadership", href: "/leadership" },
    { label: "Reviews", href: "/reviews" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Contact Us", href: "/contact" },
  ],
} as const;

/**
 * Copy for the standalone `/about` page — kept out of the homepage's scroll
 * timeline. `body` is the client's own brand copy, verbatim, held as an array so
 * each paragraph is spaced by the page rather than by splitting a string at
 * render time. `closing` is the three-line sign-off the client supplied.
 */
export const about = {
  eyebrow: "About Us",
  heading: "About Himalaya Sparsh™",
  subheading: "Redefining the Future of Premium Hydration",
  intro:
    "Himalaya Sparsh presents a thoughtfully designed water-converter device inspired by the natural journey of Himalayan water. The device combines multiple internal media layers to create a unique water experience for everyday use.",
  body: [
    "At Himalaya Sparsh™, we believe water should do more than simply quench thirst—it should elevate everyday living.",
    "In today's rapidly changing world, access to naturally sourced mountain water has become increasingly limited. Modern lifestyles often rely on treated water that prioritizes safety and convenience, yet many people continue to seek a more natural and refreshing drinking experience. Himalaya Sparsh was created to bridge this gap through an innovative, non-electric hydration device designed to complement purified water.",
    "Every Himalaya Sparsh device is meticulously crafted using premium-grade materials and carefully selected natural mineral media within a precision-engineered system. The result is a refined hydration experience inspired by the purity and balance associated with Himalayan water.",
    "Beyond functionality, Himalaya Sparsh reflects a philosophy of craftsmanship, wellness, and sustainability. Our products are designed not only to perform with consistency but also to embody elegance, making them equally suited for modern homes, premium hospitality, luxury retail, and discerning lifestyles.",
    "Innovation remains at the heart of everything we do. From product development to customer experience, we are committed to delivering exceptional quality, purposeful design, and uncompromising attention to detail.",
    "As we continue to expand globally, our mission remains unchanged—to inspire a new appreciation for water through thoughtful innovation while building one of the world's most trusted premium hydration brands.",
    "At Himalaya Sparsh™, we are not simply creating products; we are shaping a new standard for everyday hydration.",
  ] as string[],
  closing: {
    name: "Himalaya Sparsh™",
    descriptor: "The Real Magnetic Alkaline Mountain Water Device",
    tagline: "The Living Water Revolution.",
  },
  ingredientsHeading: "Ingredients",
  ingredientsIntro:
    "The confirmed media inside every Himalaya Sparsh device, in the order the water meets them. Each entry describes what the material is and where it sits in the column — what it is intended to do is noted cautiously and, where a claim would need it, marked as awaiting laboratory confirmation.",
  contactHeading: "Get in touch",
} as const;

/* -------------------------------------------------------------------------- *
 * BENEFITS OF INGREDIENTS — responsibly worded.
 *
 * This section exists to explain, in general terms, why the *categories* of
 * material inside the device are used, without asserting a medical, disease,
 * pH, ORP, TDS or guaranteed-mineral outcome for THIS product. Every entry is
 * framed as "traditionally used" / "intended to" / "may contribute", and the
 * whole section carries the disclaimer below. Nothing here names a disease,
 * a cure, an exact figure, or a certification.
 * -------------------------------------------------------------------------- */

export const ingredientBenefits = {
  heading: "Benefits of Ingredients",
  intro:
    "The materials chosen for Himalaya Sparsh are drawn from natural mineral media and traditional water-contact practices. The notes below describe the general roles these categories of material are associated with. They are not medical claims, and they do not describe a measured outcome for the water this specific device produces.",
  items: [
    {
      id: "mineral-media",
      title: "Natural mineral stones",
      body: "Himalayan, Korean and Japanese mineral stones are used as contact media through which water passes. Such media are traditionally associated with contributing to a water's mineral character and a clean, balanced taste. Any actual change in mineral content depends on testing.",
    },
    {
      id: "magnesium-zinc",
      title: "Magnesium & zinc media",
      body: "Magnesium and zinc are minerals the body uses in everyday nutrition, most of which people obtain from food. Inside the device they act as additional mineral-contact stages and are intended to support the overall conditioning of the water. The device is not presented as a dietary source of these minerals.",
    },
    {
      id: "silver",
      title: "Silver",
      body: "Silver is commonly used in water systems and storage vessels, where it is intended to help limit unwanted microbial growth and keep water fresher for longer. Product-specific performance requires laboratory confirmation.",
    },
    {
      id: "jamun-wood",
      title: "Jamun wood",
      body: "Jamun wood has a long tradition of use in water-storage and water-contact applications, where it is valued for helping keep stored water fresh and free of unpleasant odours. This is a traditional-use association rather than a tested claim.",
    },
    {
      id: "magnet",
      title: "Magnetic stage",
      body: "The magnetic stage exposes flowing water to a controlled magnetic field as an additional conditioning step, without changing the natural appearance or flow of the water. The evidence for magnetic treatment of water is limited.",
    },
  ] as { id: string; title: string; body: string }[],
  disclaimer:
    "These descriptions are general and educational. Himalaya Sparsh makes no medical, disease-treatment, weight, immunity, detoxification or diagnostic claims. Product-specific performance — including any mineral release, pH change or ORP change — requires independent laboratory confirmation and depends on testing.",
} as const;

/* -------------------------------------------------------------------------- *
 * FRUIT / FOOD COMPARISON — educational only.
 *
 * This is NOT a claim that a glass of water from the device equals any number
 * of fruits, or contains any specific quantity of a mineral. No such lab report
 * exists. It simply shows that the minerals associated with some of the device
 * media are also found naturally in everyday foods — sourced from the NIH
 * Office of Dietary Supplements consumer fact sheets and USDA FoodData Central,
 * and worded to match them (e.g. fruit is NOT presented as a major source of
 * zinc or copper, because those official sources do not present it that way).
 * -------------------------------------------------------------------------- */

export const fruitComparison = {
  heading: "Fruit & food comparison",
  label:
    "Educational ingredient comparison — not a claim about the exact nutrient content of water produced by the device.",
  intro:
    "Some of the minerals associated with the device's mineral media are also found naturally in everyday foods. The table below is drawn from official nutrition sources and is provided purely to illustrate where these minerals occur in a normal diet.",
  rows: [
    {
      mineral: "Magnesium",
      foods: "Nuts, seeds, legumes, whole grains and leafy greens such as spinach are the main sources; fruits such as banana and avocado contribute smaller amounts.",
    },
    {
      mineral: "Potassium",
      foods: "Found in many fruits and vegetables — including banana, orange, dried apricots and potato — as well as beans and leafy greens.",
    },
    {
      mineral: "Calcium",
      foods: "Dairy foods, fortified foods, canned fish with soft bones and green vegetables such as kale and broccoli are leading sources; figs and oranges add smaller amounts.",
    },
    {
      mineral: "Zinc",
      foods: "Mainly from meat, poultry, seafood, beans, nuts, whole grains and dairy. Fruit is not a significant source of zinc.",
    },
    {
      mineral: "Copper",
      foods: "Shellfish, nuts, seeds, whole grains and organ meats are the primary sources; fruit is a minor source.",
    },
  ] as { mineral: string; foods: string }[],
  sources: [
    {
      label: "USDA FoodData Central",
      href: "https://fdc.nal.usda.gov/",
    },
    {
      label: "NIH Office of Dietary Supplements — Magnesium (Consumer)",
      href: "https://ods.od.nih.gov/factsheets/Magnesium-Consumer/",
    },
    {
      label: "NIH Office of Dietary Supplements — Potassium (Consumer)",
      href: "https://ods.od.nih.gov/factsheets/Potassium-Consumer/",
    },
    {
      label: "NIH Office of Dietary Supplements — Calcium (Consumer)",
      href: "https://ods.od.nih.gov/factsheets/Calcium-Consumer/",
    },
    {
      label: "NIH Office of Dietary Supplements — Zinc (Consumer)",
      href: "https://ods.od.nih.gov/factsheets/Zinc-Consumer/",
    },
    {
      label: "NIH Office of Dietary Supplements — Copper (Consumer)",
      href: "https://ods.od.nih.gov/factsheets/Copper-Consumer/",
    },
  ] as { label: string; href: string }[],
  note: "Copper, and copper-bearing metals, are not among the nine confirmed media inside the current device; copper is included here only for educational completeness because it appears in the client's reference material.",
} as const;

/* -------------------------------------------------------------------------- *
 * LEADERSHIP — the founder's note. See `founder` above for the copy itself.
 * -------------------------------------------------------------------------- */

export const leadership = {
  eyebrow: "Leadership",
  heading: "A Note from the Founder Desk",
  intro:
    "At Himalaya Sparsh™, leadership begins with purpose — a commitment to craftsmanship, integrity and thoughtful innovation.",
} as const;

/* -------------------------------------------------------------------------- *
 * REVIEWS.
 *
 * `approved` ships EMPTY on purpose — same as the null rule everywhere else. No
 * review appears until a real, moderated one is added here (or a backend serves
 * one). The submission form on `/reviews` is presentational: there is no API,
 * database or moderation backend in this project yet, so the form validates and
 * hands off to WhatsApp/email rather than pretending to persist a review. See
 * the report for exactly what a real review workflow would require.
 * -------------------------------------------------------------------------- */

export type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  /** ISO date, e.g. "2026-06-01". */
  date: string;
  /** Only ever true when a real order backs it. */
  verifiedPurchase?: boolean;
};

export const reviews = {
  eyebrow: "Reviews",
  heading: "What people are saying",
  intro:
    "Genuine, moderated customer reviews appear here. We publish only real, approved feedback — never placeholder testimonials.",
  /** Real, approved reviews only. Empty until the client supplies verified ones. */
  approved: [] as Review[],
  emptyState:
    "There are no approved reviews yet. Once verified customers share their experience, their reviews will appear here.",
  formHeading: "Share your experience",
  formIntro:
    "Reviews are read and moderated before they appear. Submitting sends your review to our team for approval.",
} as const;

/* -------------------------------------------------------------------------- *
 * DASHBOARD.
 *
 * There is no authentication or customer-account backend in this project. The
 * `/dashboard` page therefore renders an honest preview of what a customer area
 * will contain, clearly labelled as requiring sign-in, rather than faking
 * orders, enquiries or account data. The report lists exactly what backend work
 * would light this up.
 * -------------------------------------------------------------------------- */

export const dashboard = {
  eyebrow: "Dashboard",
  heading: "Your account",
  intro:
    "Customer accounts are not yet enabled on this site. When they are, you will manage everything below from here.",
  notice:
    "Sign-in and customer accounts require a backend that this site does not yet include. Nothing on this page is live data — it is a preview of the account area to come.",
  features: [
    {
      id: "profile",
      title: "Profile & account details",
      body: "Your name, email and saved contact details, editable in one place.",
    },
    {
      id: "enquiries",
      title: "Enquiry status",
      body: "Track WhatsApp and email enquiries you have raised with our team.",
    },
    {
      id: "orders",
      title: "Order & purchase status",
      body: "Follow orders from confirmation to delivery, once ordering goes live.",
    },
    {
      id: "reviews",
      title: "Your reviews",
      body: "See the reviews you have submitted and their moderation status.",
    },
    {
      id: "support",
      title: "Support & WhatsApp",
      body: "Reach our team directly for help with your device or your order.",
    },
  ] as { id: string; title: string; body: string }[],
} as const;

/* -------------------------------------------------------------------------- *
 * CONTACT PAGE.
 *
 * The details themselves live in `contact` above. This block holds the page's
 * own copy and a map link built from the confirmed address. The contact FORM is
 * presentational only — there is no email service, API or database wired to it,
 * so on submit it opens the visitor's own mail client / WhatsApp with the
 * message pre-filled rather than claiming a submission was stored. See report.
 * -------------------------------------------------------------------------- */

export const contactPage = {
  eyebrow: "Contact Us",
  heading: "Get in touch",
  intro:
    "We would love to hear from you. Reach us on WhatsApp, by phone or email, or send a message below.",
  whatsappHref: `https://wa.me/${buyNowWhatsapp.number}`,
  /** A Google Maps search link built from the confirmed address. */
  mapHref: contact.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        contact.address,
      )}`
    : null,
  formHeading: "Send a message",
  formIntro:
    "Fill in the form and it will open your email app with the details ready to send. You can also message us directly on WhatsApp.",
} as const;

/**
 * Per-page metadata, kept beside the copy it describes. Each page reads its own
 * entry so titles and descriptions stay consistent and configurable in one file.
 */
export const pageSeo = {
  about: {
    title: about.heading,
    description:
      "About Himalaya Sparsh™ — redefining premium hydration with a non-electric device built from carefully selected natural mineral media, inspired by Himalayan water.",
  },
  leadership: {
    title: leadership.heading,
    description:
      "A note from Arveen Maan, Founder & CEO of Himalaya Sparsh™, on purpose, craftsmanship and the future of premium hydration.",
  },
  reviews: {
    title: reviews.heading,
    description:
      "Genuine, moderated customer reviews of Himalaya Sparsh™. We publish only real, approved feedback.",
  },
  dashboard: {
    title: dashboard.heading,
    description:
      "Your Himalaya Sparsh™ account area — profile, enquiries, orders, reviews and support, all in one place.",
  },
  contact: {
    title: contactPage.heading,
    description:
      "Contact Himalaya Sparsh™ — WhatsApp, phone, email and address. Open 24/7 for enquiries about our premium hydration device.",
  },
} as const;

export const seo = {
  title: `${product.name} — a scroll-driven Himalayan journey`,
  description: `${product.name}: a scroll-driven Himalayan water experience — from the glacier, through the landscape the Gonbo Rangjon stones are associated with, into the device and down through the column.`,
  keywords: [
    "Himalaya Sparsh",
    "Himalayan water converter",
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
