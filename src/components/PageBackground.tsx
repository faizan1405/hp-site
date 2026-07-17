import Image from "next/image";

type PageBackgroundProps = {
  /** Path under `/public`, typically from `pageBackgrounds` in content.ts. */
  src: string;
};

/**
 * Shared static background layer for content pages (About, Leadership,
 * Reviews, Contact). Sits behind each page's own radial glow and content —
 * a navy gradient overlay keeps existing text contrast unchanged.
 */
export function PageBackground({ src }: PageBackgroundProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        quality={60}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-900/90 to-navy-900/95" />
    </div>
  );
}
