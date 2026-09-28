import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sharp` é módulo nativo — não pode ser empacotado pelo Turbopack.
  // Usado em src/lib/imagem.ts para converter uploads do cardápio em WebP.
  serverExternalPackages: ["sharp"],
  images: {
    // Fotos de produto já vêm em WebP (src/lib/imagem.ts), mas em tamanho
    // fixo (largura máx. 1280px) — o otimizador do next/image redimensiona
    // pro tamanho de exibição real (ex.: miniatura de 64px), sem precisar do
    // plano pago do Supabase pra isso (a transformação roda na Vercel).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase local (`supabase start`) — só importa em dev.
        protocol: "http",
        hostname: "127.0.0.1",
        port: "55521",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
