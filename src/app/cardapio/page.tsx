import type { Metadata } from "next";

import { CardapioPublico } from "@/components/cardapio/cardapio-publico";
import { lerCardapioPublicado } from "@/lib/cardapio";
import { chamadaGarcomAtiva } from "@/lib/chamada-garcom";

// Cacheado (ISR) em vez de force-dynamic: a página não usa cookies/sessão
// (RLS entrega os mesmos dados pra `anon` de qualquer jeito — ver
// src/lib/supabase/public.ts). Lê de cardapio_publicado (a "foto" da última
// publicação, não as tabelas ao vivo — ver src/app/painel/publicar-actions.ts),
// que já revalida esse path na hora de publicar; `revalidate` aqui é só uma
// rede de segurança.
export const revalidate = 60;

/**
 * Pré-visualização ao compartilhar o link (WhatsApp, Instagram, Facebook…):
 * título e descrição do estabelecimento; a imagem vem de ./opengraph-image.tsx.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { config } = await lerCardapioPublicado();
  const nome = config.nome_estabelecimento;
  const descricao = `Veja o cardápio do ${nome}: pratos, bebidas e preços.`;

  return {
    title: "Cardápio",
    description: descricao,
    openGraph: {
      title: `Cardápio — ${nome}`,
      description: descricao,
      siteName: nome,
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default async function CardapioPublicoPage() {
  const [data, chamadaAtiva] = await Promise.all([
    lerCardapioPublicado(),
    chamadaGarcomAtiva(),
  ]);
  return <CardapioPublico {...data} mesaToken={null} chamadaAtiva={chamadaAtiva} />;
}
