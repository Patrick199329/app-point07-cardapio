"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { corValida } from "@/lib/cardapio-tema";
import { removerImagemProduto, salvarLogoCardapio } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Arredondamento = Database["public"]["Enums"]["cardapio_arredondamento"];
type LogoPosicao = Database["public"]["Enums"]["cardapio_logo_posicao"];
type LogoTamanho = Database["public"]["Enums"]["cardapio_logo_tamanho"];
type DescricaoCaixa = Database["public"]["Enums"]["cardapio_descricao_caixa"];

const ARREDONDAMENTOS: Arredondamento[] = [
  "nenhum",
  "pequeno",
  "medio",
  "grande",
];
const LOGO_POSICOES: LogoPosicao[] = ["esquerda", "centro", "direita"];
const LOGO_TAMANHOS: LogoTamanho[] = ["pequeno", "medio", "grande"];
const DESCRICAO_CAIXAS: DescricaoCaixa[] = ["original", "maiusculo", "frase"];

export type AparenciaState = { error: string | null; ok: boolean };

export async function salvarAparencia(
  _prev: AparenciaState,
  formData: FormData,
): Promise<AparenciaState> {
  await requireRole("admin");

  const nome_estabelecimento = String(
    formData.get("nome_estabelecimento") ?? "",
  ).trim();
  const cor_fundo = String(formData.get("cor_fundo") ?? "");
  const cor_fundo_cabecalho = String(formData.get("cor_fundo_cabecalho") ?? "");
  const cor_texto_cabecalho = String(formData.get("cor_texto_cabecalho") ?? "");
  const cor_bloco = String(formData.get("cor_bloco") ?? "");
  const cor_destaque = String(formData.get("cor_destaque") ?? "");
  const cor_categoria_nav_fundo = String(
    formData.get("cor_categoria_nav_fundo") ?? "",
  );
  const cor_categoria_nav_fundo_ativa = String(
    formData.get("cor_categoria_nav_fundo_ativa") ?? "",
  );
  const sombra = formData.get("sombra") === "true";
  const categorias_centralizadas =
    formData.get("categorias_centralizadas") === "true";
  const agrupar_categorias = formData.get("agrupar_categorias") === "true";
  const mostrar_nome_com_logo = formData.get("mostrar_nome_com_logo") === "true";
  const arredondamento = String(
    formData.get("arredondamento") ?? "medio",
  ) as Arredondamento;
  const logo_posicao = String(
    formData.get("logo_posicao") ?? "esquerda",
  ) as LogoPosicao;
  const logo_tamanho = String(
    formData.get("logo_tamanho") ?? "medio",
  ) as LogoTamanho;
  const descricao_caixa = String(
    formData.get("descricao_caixa") ?? "original",
  ) as DescricaoCaixa;

  if (!nome_estabelecimento) {
    return { error: "Informe o nome do estabelecimento.", ok: false };
  }
  const cores: [string, string][] = [
    [cor_fundo, "Cor de fundo do cardápio"],
    [cor_fundo_cabecalho, "Cor de fundo do cabeçalho"],
    [cor_texto_cabecalho, "Cor do texto do cabeçalho"],
    [cor_bloco, "Cor dos blocos de produto"],
    [cor_destaque, "Cor de destaque"],
    [cor_categoria_nav_fundo, "Cor de fundo dos botões de categoria"],
    [cor_categoria_nav_fundo_ativa, "Cor de fundo do botão de categoria em foco"],
  ];
  for (const [cor, rotulo] of cores) {
    if (!corValida(cor)) return { error: `${rotulo}: cor inválida.`, ok: false };
  }
  if (!ARREDONDAMENTOS.includes(arredondamento)) {
    return { error: "Arredondamento inválido.", ok: false };
  }
  if (!LOGO_POSICOES.includes(logo_posicao)) {
    return { error: "Posição da logo inválida.", ok: false };
  }
  if (!LOGO_TAMANHOS.includes(logo_tamanho)) {
    return { error: "Tamanho da logo inválido.", ok: false };
  }
  if (!DESCRICAO_CAIXAS.includes(descricao_caixa)) {
    return { error: "Padrão de caixa da descrição inválido.", ok: false };
  }

  const supabase = await createClient();
  const update: {
    nome_estabelecimento: string;
    cor_fundo: string;
    cor_fundo_cabecalho: string;
    cor_texto_cabecalho: string;
    cor_bloco: string;
    cor_destaque: string;
    cor_categoria_nav_fundo: string;
    cor_categoria_nav_fundo_ativa: string;
    sombra: boolean;
    categorias_centralizadas: boolean;
    agrupar_categorias: boolean;
    mostrar_nome_com_logo: boolean;
    arredondamento: Arredondamento;
    logo_posicao: LogoPosicao;
    logo_tamanho: LogoTamanho;
    descricao_caixa: DescricaoCaixa;
    logo_path?: string | null;
  } = {
    nome_estabelecimento,
    cor_fundo,
    cor_fundo_cabecalho,
    cor_texto_cabecalho,
    cor_bloco,
    cor_destaque,
    cor_categoria_nav_fundo,
    cor_categoria_nav_fundo_ativa,
    sombra,
    categorias_centralizadas,
    agrupar_categorias,
    mostrar_nome_com_logo,
    arredondamento,
    logo_posicao,
    logo_tamanho,
    descricao_caixa,
  };

  if (formData.get("remover_logo") === "true") {
    const { data } = await supabase
      .from("cardapio_config")
      .select("logo_path")
      .eq("id", 1)
      .single();
    if (data?.logo_path) await removerImagemProduto(data.logo_path);
    update.logo_path = null;
  } else {
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      const res = await salvarLogoCardapio(file);
      if (!res.ok) return { error: res.error, ok: false };
      update.logo_path = res.path;
    }
  }

  const { error } = await supabase
    .from("cardapio_config")
    .update(update)
    .eq("id", 1);
  if (error) return { error: "Não foi possível salvar a aparência.", ok: false };

  revalidatePath("/painel/configuracoes/cardapio");
  revalidatePath("/cardapio");
  return { error: null, ok: true };
}
