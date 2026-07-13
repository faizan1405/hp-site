/**
 * Single source of truth for every piece of copy and every asset path used by
 * the glacier experience. Swap values here to re-skin the site for a different
 * product — no component edits required.
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

export const assets = {
  video: "/videos/glacier-journey.mp4",
  poster: "/images/video-poster.jpg",
  product: "/images/product-front.png",
  logo: "/images/logo.svg",
} as const;

export const brand = {
  name: "Aqua Glacia",
  logoAlt: "Aqua Glacia",
  tagline: "Natural mineral water, sourced at the glacier line.",
} as const;

export const scenes = {
  /** Scene 1 — 0% to 15% */
  opening: {
    headline: "Born from the purity of nature",
    instruction: "Scroll to discover",
    range: { inStart: 0, inEnd: 0, outStart: 11, outEnd: 15 } satisfies ScrollRange,
  },
  /** Scene 2 — 15% to 35% */
  source: {
    eyebrow: "The Source",
    heading: "Where purity begins",
    body: "High above the treeline, untouched glaciers hold water that has never met a city, a pipeline or a factory. As the ice yields, that water flows freely through ancient mineral rock — filtered slowly, naturally, over centuries. This is where our bottle begins.",
    range: { inStart: 15, inEnd: 20, outStart: 31, outEnd: 35 } satisfies ScrollRange,
  },
  /** Scene 3 — 35% to 55% */
  journey: {
    eyebrow: "Natural Purity",
    heading: "Every drop tells a story",
    highlights: [
      {
        title: "Pure source",
        description: "Drawn at the glacier line, far from any settlement.",
      },
      {
        title: "Carefully processed",
        description: "Untouched by hand, bottled at the spring itself.",
      },
      {
        title: "Premium quality",
        description: "Tested against standards stricter than our own.",
      },
    ],
    range: { inStart: 35, inEnd: 40, outStart: 51, outEnd: 55 } satisfies ScrollRange,
  },
  /** Scene 4 — 55% to 75% */
  product: {
    eyebrow: "The Bottle",
    name: "Aqua Glacia — Glacier Reserve",
    description:
      "A still mineral water of exceptional softness, bottled once and never blended.",
    badge: "Premium Quality",
    range: { inStart: 55, inEnd: 66, outStart: 71, outEnd: 75 } satisfies ScrollRange,
  },
  /** Scene 5 — 75% to 92% */
  benefits: [
    {
      id: "mineral",
      title: "Naturally balanced minerals",
      description:
        "Calcium, magnesium and silica in the proportions the mountain gave them. Nothing added, nothing removed.",
      range: { inStart: 75, inEnd: 78, outStart: 79.5, outEnd: 81 },
    },
    {
      id: "soft",
      title: "Remarkably soft on the palate",
      description:
        "A low mineral load and near-neutral pH make it clean, light and effortless to drink.",
      range: { inStart: 81, inEnd: 84, outStart: 85.5, outEnd: 87 },
    },
    {
      id: "responsible",
      title: "Sourced responsibly",
      description:
        "Drawn well within the aquifer's natural recharge rate, in fully recyclable packaging.",
      range: { inStart: 87, inEnd: 89.5, outStart: 90.5, outEnd: 92 },
    },
  ] satisfies Benefit[],
  /** Scene 6 — 92% to 100% */
  cta: {
    eyebrow: "Bring the glacier home",
    name: "Aqua Glacia — Glacier Reserve",
    price: "$—.—",
    priceNote: "750 ml glass bottle · case of 12",
    description:
      "Bottled at source, shipped cold, delivered to your door. The mountain, exactly as it is.",
    buyLabel: "Buy Now",
    buyHref: "#",
    whatsappLabel: "Enquire on WhatsApp",
    /** Replace with the real number in international format, digits only. */
    whatsappNumber: "10000000000",
    whatsappMessage: "Hi, I'd like to enquire about Aqua Glacia Glacier Reserve.",
    // No exit: the CTA is the last thing on the page and must stay on screen.
    range: { inStart: 92, inEnd: 98, outStart: 100, outEnd: 100 } satisfies ScrollRange,
  },
} as const;

export const contact = {
  email: "hello@aquaglacia.example",
  phone: "+1 (000) 000-0000",
  address: "Glacier Reserve Bottling, Alpine Valley",
} as const;

export const seo = {
  title: "Aqua Glacia — Glacier Reserve Mineral Water",
  description:
    "Aqua Glacia Glacier Reserve is a still mineral water drawn at the glacier line and bottled at source. Born from the purity of nature.",
  keywords: [
    "glacier water",
    "premium mineral water",
    "natural spring water",
    "Aqua Glacia",
  ],
  siteUrl: "https://aquaglacia.example",
} as const;

/** WhatsApp deep link built from the CTA config. */
export const whatsappHref = `https://wa.me/${scenes.cta.whatsappNumber}?text=${encodeURIComponent(
  scenes.cta.whatsappMessage,
)}`;

/** Scroll distance of the pinned experience, per breakpoint. */
export const scrollDistance = {
  desktop: "600vh",
  mobile: "450vh",
} as const;
