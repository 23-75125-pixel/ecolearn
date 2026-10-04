import type { NextConfig } from "next";

/** Baseline security headers sent with every response. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Allow high-quality renders (quality={90}) and serve AVIF/WebP for crisp, small files.
    qualities: [75, 85, 90],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      // Credential uploads are capped at 5 MB (see lib/validations/tutor.ts).
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
