import { createClient } from "@/lib/supabase/server";

export type OpcaoPublica = { id: string; nome: string };

export type GrupoOpcoesPublico = {
  id: string;
  titulo: string;
  observacao: string | null;
  opcoes: OpcaoPublica[];
};

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
  imagem_layout: "miniatura" | "grande";
  grupos: GrupoOpcoesPublico[];
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
 * (migrations 20260909130000 e 20260911120000) já entrega só categorias,
 * produtos, grupos de opções e avisos ativos. Categorias sem produtos ativos
 * são descartadas.
 */
export async function carregarCardapioPublico(): Promise<CardapioPublicoData> {
  const supabase = await createClient();

  const [{ data: categoriasRaw }, { data: avisos }] = await Promise.all([
    supabase
      .from("categorias")
      .select(
        "id, nome, produtos(id, nome, descricao, modelo, preco, preco_medio, preco_grande, serve_ate, imagem_path, imagem_layout, produto_grupos_opcoes(id, titulo, observacao, produto_opcoes(id, nome)))",
      )
      .order("ordem", { ascending: true })
      .order("ordem", { ascending: true, referencedTable: "produtos" })
      .order("ordem", {
        ascending: true,
        referencedTable: "produtos.produto_grupos_opcoes",
      })
      .order("ordem", {
        ascending: true,
        referencedTable: "produtos.produto_grupos_opcoes.produto_opcoes",
      }),
    supabase
      .from("avisos")
      .select("id, texto")
      .order("ordem", { ascending: true }),
  ]);

  const categorias = (categoriasRaw ?? [])
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      produtos: (c.produtos ?? []).map((p) => ({
        ...p,
        grupos: (p.produto_grupos_opcoes ?? []).map((g) => ({
          id: g.id,
          titulo: g.titulo,
          observacao: g.observacao,
          opcoes: g.produto_opcoes ?? [],
        })),
      })),
    }))
    .filter((c) => c.produtos.length > 0);

  return { categorias, avisos: avisos ?? [] };
}
