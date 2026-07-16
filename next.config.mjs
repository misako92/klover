import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Security headers (including nonce-based CSP) are set in middleware.ts
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: true,
      },
      {
        source: "/diagnostic",
        destination: "/contact",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry logs during build
  silent: true,
  // Upload source maps for production debugging
  widenClientFileUpload: true,
  // Hide source maps from users
  hideSourceMaps: true,
  // Disable Sentry telemetry
  disableLogger: true,
});
