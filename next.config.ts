import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sharp` é módulo nativo — não pode ser empacotado pelo Turbopack.
  // Usado em src/lib/imagem.ts para converter uploads do cardápio em WebP.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
