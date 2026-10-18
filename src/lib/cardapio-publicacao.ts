import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Marca que o rascunho do cardápio mudou desde a última publicação — chamado
 * por toda ação que edita categorias, produtos, opções, avisos ou aparência.
 * O botão "Publicar" do painel compara isso com `cardapio_publicado.publicado_em`
 * pra saber se tem algo pendente.
 */
export async function marcarRascunhoAlterado(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("cardapio_rascunho_status")
    .update({ alterado_em: new Date().toISOString() })
    .eq("id", 1);
}
