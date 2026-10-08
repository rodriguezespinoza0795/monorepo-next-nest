import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas de punta a punta compilan en su propia carpeta para no
  // chocar con el servidor de desarrollo (ver playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
