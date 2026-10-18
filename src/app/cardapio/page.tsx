import type { Metadata } from "next";

import { CardapioPublico } from "@/components/cardapio/cardapio-publico";
import { lerCardapioPublicado } from "@/lib/cardapio";

// Cacheado (ISR) em vez de force-dynamic: a página não usa cookies/sessão
// (RLS entrega os mesmos dados pra `anon` de qualquer jeito — ver
// src/lib/supabase/public.ts). Lê de cardapio_publicado (a "foto" da última
// publicação, não as tabelas ao vivo — ver src/app/painel/publicar-actions.ts),
// que já revalida esse path na hora de publicar; `revalidate` aqui é só uma
// rede de segurança.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Cardápio do Point07",
};

export default async function CardapioPublicoPage() {
  const data = await lerCardapioPublicado();
  return <CardapioPublico {...data} mesaToken={null} />;
}
