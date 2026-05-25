const path = require("path");

/** @type {import('next').NextConfig} */

const CDN_DOMAIN = (process.env.CDN_URL || "https://cdn.auntsex.tv").replace(/^https?:\/\//, "").replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: CDN_DOMAIN },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://${CDN_DOMAIN}; media-src 'self' https://${CDN_DOMAIN}; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`,
        },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    },
  ],
};

module.exports = nextConfig;
