import type { MetadataRoute } from "next";

/**
 * `/robots.txt` — sem isso, o proxy de autenticação (src/proxy.ts) tratava
 * essa rota como protegida e devolvia um redirect pro /login em vez de um
 * robots.txt de verdade (fazia o Lighthouse/PageSpeed reportar "robots.txt
 * inválido"). Só o cardápio público é indexável; áreas de equipe (painel,
 * fila, login) ficam de fora.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/cardapio", "/mesa"],
        disallow: ["/painel", "/fila", "/login", "/api"],
      },
    ],
  };
}
