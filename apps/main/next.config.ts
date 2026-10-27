import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin `AGENTS.md` / `CLAUDE.md` generados por `next dev`: las reglas del
  // proyecto viven en el `CLAUDE.md` de la raíz.
  agentRules: false,
};

export default nextConfig;
