import type { Metadata } from "next";

import { CardapioPublico } from "@/components/cardapio/cardapio-publico";
import { carregarCardapioPublico } from "@/lib/cardapio";

// Cacheado (ISR) em vez de force-dynamic: a página não usa cookies/sessão
// (RLS entrega os mesmos dados pra `anon` de qualquer jeito — ver
// src/lib/supabase/public.ts), e toda ação que edita o cardápio já chama
// revalidatePath("/cardapio"), então uma edição aparece na próxima visita
// mesmo com cache. `revalidate` aqui é só uma rede de segurança caso algum
// caminho de edição esqueça de revalidar.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cardápio — Point07",
  description: "Cardápio do Point07",
};

export default async function CardapioPublicoPage() {
  const data = await carregarCardapioPublico();
  return <CardapioPublico {...data} mesaToken={null} />;
}
