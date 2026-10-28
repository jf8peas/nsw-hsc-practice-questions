/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Renders concept illustrations to a picture for the reviewer (spec 002). It is a native
  // module, so it stays out of the bundle, and the font it draws text with is traced into the
  // two functions that run the concept pipeline.
  serverExternalPackages: ["@resvg/resvg-js"],
  outputFileTracingIncludes: {
    "/api/units/[unitId]/concepts/ensure": ["./assets/fonts/**"],
    "/api/admin/concepts/regenerate": ["./assets/fonts/**"],
  },
};

export default nextConfig;
