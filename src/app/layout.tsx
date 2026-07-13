import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { assets, brand, scenes, seo } from "@/config/content";
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

export const metadata: Metadata = {
  metadataBase: new URL(seo.siteUrl),
  title: {
    default: seo.title,
    template: `%s — ${brand.name}`,
  },
  description: seo.description,
  keywords: [...seo.keywords],
  applicationName: brand.name,
  authors: [{ name: brand.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: seo.siteUrl,
    siteName: brand.name,
    title: seo.title,
    description: seo.description,
    images: [
      {
        url: assets.poster,
        width: 1920,
        height: 1080,
        alt: "A glacier valley, the source of Aqua Glacia mineral water",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    images: [assets.poster],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#061321",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: scenes.cta.name,
  brand: { "@type": "Brand", name: brand.name },
  description: scenes.product.description,
  image: [assets.product],
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
      <body>{children}</body>
    </html>
  );
}
