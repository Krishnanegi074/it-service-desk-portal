import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser tests use an isolated build directory so they can run while the
  // developer's normal `next dev` process is already using `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next'
};

export default nextConfig;
