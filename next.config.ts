import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: Number(process.env.NEXT_BUILD_CPUS ?? 1),
    memoryBasedWorkersCount: false,
    optimizePackageImports: ["lucide-react"],
    webpackMemoryOptimizations: true,
    workerThreads: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
