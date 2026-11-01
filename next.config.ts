import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode double-mount races with drei <Html> portals in R3F.
  reactStrictMode: false,
  // Avoid rewriting AGENTS.md on every compile (can thrash file watchers).
  agentRules: false,
};

export default nextConfig;
