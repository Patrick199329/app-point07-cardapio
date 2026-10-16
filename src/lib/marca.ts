import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

/**
 * Nome do site (aba do navegador) e favicon — lidos de `cardapio_config` e
 * aplicados em TODAS as páginas (cardápio público e painel admin), por isso
 * ficam no layout raiz. Cache curto (não é por request): essa leitura roda
 * em toda navegação, inclusive dentro do painel, que já faz suas próprias
 * consultas — sem cache aqui seria uma consulta extra ao banco por página.
 * `salvarAparencia` chama `revalidateTag("branding")` pra refletir na hora.
 */
export const carregarMarca = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("cardapio_config")
      .select("nome_estabelecimento, favicon_path")
      .eq("id", 1)
      .single();
    return {
      nome: data?.nome_estabelecimento ?? "Point07",
      faviconPath: data?.favicon_path ?? null,
    };
  },
  ["marca-site"],
  { tags: ["branding"], revalidate: 300 },
);
