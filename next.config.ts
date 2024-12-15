import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all hostnames with HTTPS protocol
      },
      {
        protocol: "http",
        hostname: "**", // Allow all hostnames with HTTP protocol
      },
    ],
  },
};

export default nextConfig;
