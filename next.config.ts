import type { NextConfig } from "next";
import os from "node:os";

const localOrigins: string[] = [
  "localhost",
  "127.0.0.1",
  "192.168.*",
  "10.*",
  "172.*",
  "*.local",
];
try {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const info of ifaces || []) {
      if (info.family === "IPv4") {
        localOrigins.push(info.address);
        localOrigins.push(`${info.address}:3000`);
      }
    }
  }
} catch {}

const nextConfig: NextConfig = {
  output: "export",
  // Set by CI to the GitHub Pages base path (e.g. "/hope") for project
  // pages; empty for local dev and for user/org root pages.
  basePath: process.env.NEXT_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: localOrigins,
};

export default nextConfig;
