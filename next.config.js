/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { links, youtubeHref } from "./src/lib/links.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=()",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
        source: "/(.*)",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/youtube",
        destination: youtubeHref,
        permanent: false,
      },
      {
        source: "/live",
        destination: youtubeHref,
        permanent: false,
      },
      {
        source: "/tutorial",
        destination: "https://www.youtube.com/watch?v=Y_NrWcWSqGQ",
        permanent: false,
      },
      ...links.map((link) => ({
        source: `/${link.label}`,
        destination: link.label === "email" ? "/contact" : link.href,
        permanent: false,
      })),
    ];
  },
};

export default config;
