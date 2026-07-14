import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { assets, brand, product, scenes, seo, siteName } from "@/config/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/**
 * Falls back to localhost rather than to an invented domain: a placeholder like
 * "example.com" would be published in every canonical and Open Graph tag.
 * Set NEXT_PUBLIC_SITE_URL and the real one flows through automatically.
 */
const metadataBase = new URL(seo.siteUrl ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: seo.title,
    template: `%s — ${siteName}`,
  },
  description: seo.description,
  keywords: [...seo.keywords],
  applicationName: siteName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: seo.title,
    description: seo.description,
    images: [
      {
        url: assets.poster,
        width: 1920,
        height: 1080,
        alt: "A Himalayan glacier valley",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    images: [assets.poster],
  },
  // Nothing is indexable until the real domain exists.
  robots: seo.siteUrl ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#061321",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Structured data describes the device and nothing else. No `offers` block until
 * there is a real price and a real buy URL, and no `brand` until the brand name
 * is confirmed — a wrong one here would be republished by every crawler.
 */
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: scenes.device.intro.body,
  image: [new URL(assets.device, metadataBase).toString()],
  ...(brand.name ? { brand: { "@type": "Brand", name: brand.name } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${display.variable} antialiased`}
    >
      <head>
        <link rel="preload" as="image" href={assets.poster} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      </head>
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
