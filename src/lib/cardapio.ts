import { createClient } from "@/lib/supabase/server";

export type ProdutoPublico = {
  id: string;
  nome: string;
  descricao: string | null;
  modelo: "simples" | "tamanhos" | "compartilhar";
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  serve_ate: number | null;
  imagem_path: string | null;
};

export type CategoriaPublica = {
  id: string;
  nome: string;
  produtos: ProdutoPublico[];
};

export type CardapioPublicoData = {
  categorias: CategoriaPublica[];
  avisos: { id: string; texto: string }[];
};

/**
 * Carrega o cardápio visível ao público. Sem sessão, roda como `anon` — a RLS
 * (migration 20260909130000) já entrega só categorias/produtos/avisos ativos.
 * Categorias sem produtos ativos são descartadas.
 */
export async function carregarCardapioPublico(): Promise<CardapioPublicoData> {
  const supabase = await createClient();

  const [{ data: categoriasRaw }, { data: avisos }] = await Promise.all([
    supabase
      .from("categorias")
      .select(
        "id, nome, produtos(id, nome, descricao, modelo, preco, preco_medio, preco_grande, serve_ate, imagem_path)",
      )
      .order("ordem", { ascending: true })
      .order("ordem", { ascending: true, referencedTable: "produtos" }),
    supabase
      .from("avisos")
      .select("id, texto")
      .order("ordem", { ascending: true }),
  ]);

  const categorias = (categoriasRaw ?? [])
    .map((c) => ({ id: c.id, nome: c.nome, produtos: c.produtos ?? [] }))
    .filter((c) => c.produtos.length > 0);

  return { categorias, avisos: avisos ?? [] };
}
