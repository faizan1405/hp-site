import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google account profile photos, shown in the nav and dashboard.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudinary-hosted profile, review and site-media uploads.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        /**
         * The glacier frame sequence. These files are content-immutable — a new
         * cut of the footage means a fresh extraction, and `extract-frames.mjs`
         * rewrites the directory wholesale — so a returning visitor should never
         * revalidate them. Without this, /public is served `max-age=0` and every
         * repeat visit pays for a few hundred conditional requests before the
         * first frame can be drawn.
         */
        source: "/frames/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
