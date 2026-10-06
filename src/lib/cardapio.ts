import { createPublicClient } from "@/lib/supabase/public";
import type {
  Arredondamento,
  DescricaoCaixa,
  LogoPosicao,
  LogoTamanho,
} from "@/lib/cardapio-tema";

export type CardapioConfig = {
  nome_estabelecimento: string;
  logo_path: string | null;
  logo_posicao: LogoPosicao;
  logo_tamanho: LogoTamanho;
  mostrar_nome_com_logo: boolean;
  cor_fundo: string;
  cor_fundo_cabecalho: string;
  cor_texto_cabecalho: string;
  cor_bloco: string;
  cor_destaque: string;
  cor_categoria_nav_fundo: string;
  cor_categoria_nav_fundo_ativa: string;
  sombra: boolean;
  arredondamento: Arredondamento;
  categorias_centralizadas: boolean;
  agrupar_categorias: boolean;
  descricao_caixa: DescricaoCaixa;
  mesa_confirmar_apos_minutos: number;
  avisos_fixos: boolean;
  updated_at: string;
};

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
  preco_medio_label: string | null;
  preco_grande_label: string | null;
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
  config: CardapioConfig;
};

const CONFIG_PADRAO: CardapioConfig = {
  nome_estabelecimento: "Point07",
  logo_path: null,
  logo_posicao: "esquerda",
  logo_tamanho: "medio",
  mostrar_nome_com_logo: true,
  cor_fundo: "#f5f5f4",
  cor_fundo_cabecalho: "#ffffff",
  cor_texto_cabecalho: "#111111",
  cor_bloco: "#ffffff",
  cor_destaque: "#f07e22",
  cor_categoria_nav_fundo: "#ffffff",
  cor_categoria_nav_fundo_ativa: "#ffffff",
  sombra: true,
  arredondamento: "medio",
  categorias_centralizadas: false,
  agrupar_categorias: false,
  descricao_caixa: "original",
  mesa_confirmar_apos_minutos: 15,
  avisos_fixos: true,
  updated_at: new Date(0).toISOString(),
};

/**
 * Carrega o cardápio visível ao público. Sem sessão, roda como `anon` — a RLS
 * (migrations 20260909130000, 20260911120000 e 20260914120000) já entrega só
 * categorias, produtos, grupos de opções e avisos ativos, mais a aparência
 * (linha única de `cardapio_config`, leitura pública). Categorias sem
 * produtos ativos são descartadas.
 */
export async function carregarCardapioPublico(): Promise<CardapioPublicoData> {
  const supabase = createPublicClient();

  const [{ data: categoriasRaw }, { data: avisos }, { data: config }] =
    await Promise.all([
      supabase
        .from("categorias")
        .select(
          "id, nome, produtos(id, nome, descricao, modelo, preco, preco_medio, preco_grande, preco_medio_label, preco_grande_label, serve_ate, imagem_path, imagem_layout, produto_grupos_opcoes(id, titulo, observacao, produto_opcoes(id, nome)))",
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
      supabase.from("cardapio_config").select("*").eq("id", 1).single(),
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

  return { categorias, avisos: avisos ?? [], config: config ?? CONFIG_PADRAO };
}
