import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Set by CI to the GitHub Pages base path (e.g. "/hope") for project
  // pages; empty for local dev and for user/org root pages.
  basePath: process.env.NEXT_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
