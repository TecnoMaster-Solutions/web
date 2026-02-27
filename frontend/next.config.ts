import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://copyright-phase-hair-firewall.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
