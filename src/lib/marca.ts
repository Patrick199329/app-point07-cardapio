import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

/**
 * Nome do site (aba do navegador) e favicon, aplicados em TODAS as páginas
 * (cardápio público e painel admin), por isso ficam no layout raiz.
 *
 * O nome vem de `cardapio_config` (mesmo "Nome do estabelecimento" já usado
 * no cabeçalho do cardápio) e o favicon de `sistema_config` (ao lado da logo
 * interna, em Identidade do Sistema — RLS já permite leitura anônima ali,
 * usada pela tela de login).
 *
 * Cache curto (não é por request): essa leitura roda em toda navegação,
 * inclusive dentro do painel, que já faz suas próprias consultas — sem
 * cache aqui seria uma consulta extra ao banco por página. As ações que
 * salvam esses campos chamam `revalidateTag("branding")` pra refletir na
 * hora.
 */
export const carregarMarca = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: cardapio }, { data: sistema }] = await Promise.all([
      supabase
        .from("cardapio_config")
        .select("nome_estabelecimento")
        .eq("id", 1)
        .single(),
      supabase.from("sistema_config").select("favicon_path").eq("id", 1).single(),
    ]);
    return {
      nome: cardapio?.nome_estabelecimento ?? "Point07",
      faviconPath: sistema?.favicon_path ?? null,
    };
  },
  ["marca-site"],
  { tags: ["branding"], revalidate: 300 },
);
