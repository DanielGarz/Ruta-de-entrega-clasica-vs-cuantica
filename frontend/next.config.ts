import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que `next dev` genere AGENTS.md y CLAUDE.md en cada arranque.
  agentRules: false,
};

export default nextConfig;
