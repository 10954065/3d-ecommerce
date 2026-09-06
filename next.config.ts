import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Product image / 3D asset uploads in the admin go through Server Actions;
    // the framework default (1MB) is too small for photography or GLB files.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
