import type { MetadataRoute } from "next";

/**
 * Manifest da PWA — existe hoje só pra viabilizar o bônus de push no iPhone:
 * o Web Push da Apple (iOS 16.4+) só funciona depois que o site é adicionado
 * à Tela de Início como app (ver docs/Push-Notificacoes-Garcom-Bonus.md).
 * Sem isso, "Adicionar à Tela de Início" no Safari cria só um atalho comum.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Point07",
    short_name: "Point07",
    description: "Cardápio digital e atendimento de salão — Point07",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f07e22",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
