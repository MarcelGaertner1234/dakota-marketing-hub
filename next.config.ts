import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3003",
    "http://127.0.0.1:3003",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'icbppcieyplksnajmwwr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
