import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sharp` é módulo nativo — não pode ser empacotado pelo Turbopack.
  // Usado em src/lib/imagem.ts para converter uploads do cardápio em WebP.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Padrão do Next é 1MB — foto de celular passa disso e o upload de imagem
      // (produto, logo, favicon) falhava antes de chegar na Server Action. 4MB é
      // o teto prático: a Vercel recusa corpo de requisição acima de 4,5MB. As
      // imagens já são reduzidas no navegador antes do envio (imagem-cliente.ts).
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
