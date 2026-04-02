import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3003",
    "http://127.0.0.1:3003",
  ],
};

export default nextConfig;
