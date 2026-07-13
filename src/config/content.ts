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
  name: "Himalaya Sparsh",
  logoAlt: "Himalaya Sparsh",
  tagline: "The Living Water",
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
        description: "Handled as little as possible, on its way from ice to vessel.",
      },
      {
        title: "Premium quality",
        description: "Held to a standard you can taste before you read about it.",
      },
    ],
    range: { inStart: 35, inEnd: 40, outStart: 51, outEnd: 55 } satisfies ScrollRange,
  },
  /** Scene 4 — 55% to 75% */
  product: {
    eyebrow: "The Vessel",
    name: "Himalaya Sparsh — The Living Water",
    description:
      "Himalayan mineral water, presented in a copper vessel made to be kept.",
    badge: "Premium Quality",
    range: { inStart: 55, inEnd: 66, outStart: 71, outEnd: 75 } satisfies ScrollRange,
  },
  /**
   * Scene 5 — 75% to 92%
   *
   * PLACEHOLDER COPY. Deliberately free of specific claims — no mineral
   * figures, no pH, no certifications — because inventing them for a real
   * water product would be a claim the brand has to stand behind. Replace with
   * the client's approved wording before launch.
   */
  benefits: [
    {
      id: "source",
      title: "Born in the high Himalaya",
      description:
        "Water that begins where the ice does, far above anything that could touch it.",
      range: { inStart: 75, inEnd: 78, outStart: 79.5, outEnd: 81 },
    },
    {
      id: "copper",
      title: "Held in copper",
      description:
        "A vessel drawn from an older tradition of drinking water, made to be kept rather than discarded.",
      range: { inStart: 81, inEnd: 84, outStart: 85.5, outEnd: 87 },
    },
    {
      id: "living",
      title: "The living water",
      description:
        "Bottled at the source and left as it was found — nothing about it hurried.",
      range: { inStart: 87, inEnd: 89.5, outStart: 90.5, outEnd: 92 },
    },
  ] satisfies Benefit[],
  /** Scene 6 — 92% to 100% */
  cta: {
    eyebrow: "Bring the mountain home",
    name: "Himalaya Sparsh — The Living Water",
    price: "₹—",
    // Deliberately vague: the real specification has not been supplied.
    priceNote: "Specification to be confirmed",
    description:
      "Himalayan mineral water in a copper vessel, delivered to your door.",
    buyLabel: "Buy Now",
    buyHref: "#",
    whatsappLabel: "Enquire on WhatsApp",
    /** Replace with the real number in international format, digits only. */
    whatsappNumber: "10000000000",
    whatsappMessage: "Hi, I'd like to enquire about Himalaya Sparsh.",
    // No exit: the CTA is the last thing on the page and must stay on screen.
    range: { inStart: 92, inEnd: 98, outStart: 100, outEnd: 100 } satisfies ScrollRange,
  },
} as const;

/** PLACEHOLDER. None of these reach a real inbox, phone or address. */
export const contact = {
  email: "hello@example.com",
  phone: "+00 00000 00000",
  address: "Address to be confirmed",
} as const;

export const seo = {
  title: "Himalaya Sparsh — The Living Water",
  description:
    "Himalaya Sparsh is Himalayan mineral water, presented in a copper vessel. Born from the purity of nature.",
  keywords: [
    "Himalaya Sparsh",
    "Himalayan mineral water",
    "copper water bottle",
    "glacier water",
  ],
  /** PLACEHOLDER — set to the real domain before launch (drives canonical + OG URLs). */
  siteUrl: "https://example.com",
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
