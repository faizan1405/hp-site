import Image from "next/image";

type PageBackgroundProps = {
  /** Path under `/public`, typically from `pageBackgrounds` in content.ts. */
  src: string;
};

/**
 * Shared static background layer for content pages (About, Leadership,
 * Reviews, Contact). Rendered as direct children of the page's `relative
 * isolate` <main> so z-0/z-[1] stack correctly instead of being pulled into
 * the root stacking context by a negative z-index.
 */
export function PageBackground({ src }: PageBackgroundProps) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        quality={70}
        className="absolute inset-0 z-0 object-cover"
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-navy-900/55 via-navy-900/65 to-navy-900/75" />
    </>
  );
}
