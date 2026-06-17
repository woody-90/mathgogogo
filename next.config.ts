import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages 项目站点需要子路径，开发时不需要
  basePath: isProd ? "/mathgogogo" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
