import Image from "next/image";

const defaultOverlay =
  "bg-gradient-to-b from-navy-900/45 via-navy-900/60 to-navy-900/75";

type PageBackgroundProps = {
  /** Path under `/public`, typically from `pageBackgrounds` in content.ts. */
  src: string;
  /**
   * Tailwind `object-*` utilities controlling which part of the photo stays
   * in frame, e.g. `"object-[65%_50%] sm:object-[55%_50%] lg:object-center"`.
   * Defaults to a plain center crop.
   */
  objectPosition?: string;
  /**
   * Overrides the default readability overlay — only when a photo's bright
   * area (e.g. open sky) needs stronger contrast under the hero text.
   */
  overlayClassName?: string;
};

/**
 * Fixed background layer for content pages (About, Leadership, Reviews,
 * Contact). `fixed` (not `absolute`) so the photo stays pinned to the
 * viewport while page content scrolls over it — rendered inside each page's
 * own `relative isolate` <main>, so it unmounts on navigation instead of
 * leaking into other routes, and stacks cleanly against that page's z-10
 * content instead of escaping into the root stacking context.
 */
export function PageBackground({
  src,
  objectPosition = "object-center",
  overlayClassName = defaultOverlay,
}: PageBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        quality={80}
        className={`object-cover ${objectPosition}`}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}
