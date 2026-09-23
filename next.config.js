/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { securityHeaders } from "./src/lib/security-headers.js";

/** @type {import("next").NextConfig} */
const config = {
  outputFileTracingRoot: import.meta.dirname,
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
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
        source: "/(.*)",
      },
    ];
  },
};

export default config;
