import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from modifying the repository's AGENTS.md
  agentRules: false,
};

export default nextConfig;
