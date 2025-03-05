import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = config;