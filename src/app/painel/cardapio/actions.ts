"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { parsePreco } from "@/lib/formato";
import { removerImagemProduto, salvarImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type ProdutoModelo = Database["public"]["Enums"]["produto_modelo"];

export type CardapioState = { error: string | null; ok: boolean };

const MODELOS: ProdutoModelo[] = ["simples", "tamanhos", "compartilhar"];

function revalidarCardapio() {
  revalidatePath("/painel/cardapio", "layout");
  revalidatePath("/cardapio");
}

/** Próximo valor de `ordem` (max + 1) para inserir no fim da lista. */
async function proximaOrdem(
  tabela: "categorias" | "produtos" | "avisos",
  categoriaId?: string,
) {
  const supabase = await createClient();
  if (tabela === "produtos" && categoriaId) {
    const { data } = await supabase
      .from("produtos")
      .select("ordem")
      .eq("categoria_id", categoriaId)
      .order("ordem", { ascending: false })
      .limit(1);
    return (data?.[0]?.ordem ?? -1) + 1;
  }
  const { data } = await supabase
    .from(tabela)
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1);
  return (data?.[0]?.ordem ?? -1) + 1;
}

// ===========================================================================
// Categorias
// ===========================================================================

export async function criarCategoria(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome da categoria.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .insert({ nome, ordem: await proximaOrdem("categorias") });
  if (error) return { error: "Não foi possível criar a categoria.", ok: false };

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function atualizarCategoria(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!id) return { error: "Categoria não identificada.", ok: false };
  if (!nome) return { error: "Informe o nome da categoria.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update({ nome })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar.", ok: false };

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function definirStatusCategoria(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("categorias").update({ ativo }).eq("id", id);
  revalidarCardapio();
}

// ===========================================================================
// Produtos
// ===========================================================================

type ProdutoData = {
  categoria_id: string;
  nome: string;
  descricao: string | null;
  modelo: ProdutoModelo;
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  serve_ate: number | null;
};

type Parse<T> = { ok: false; error: string } | { ok: true; data: T };

function precoValido(n: number | null): n is number {
  return n !== null && Number.isFinite(n) && n >= 0;
}

function parseProdutoForm(formData: FormData): Parse<ProdutoData> {
  const categoria_id = String(formData.get("categoria_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const modelo = String(formData.get("modelo") ?? "simples") as ProdutoModelo;

  if (!categoria_id) return { ok: false, error: "Categoria não identificada." };
  if (!nome) return { ok: false, error: "Informe o nome do produto." };
  if (!MODELOS.includes(modelo)) return { ok: false, error: "Modelo inválido." };

  const base: ProdutoData = {
    categoria_id,
    nome,
    descricao,
    modelo,
    preco: null,
    preco_medio: null,
    preco_grande: null,
    serve_ate: null,
  };

  if (modelo === "simples" || modelo === "compartilhar") {
    const preco = parsePreco(formData.get("preco"));
    if (!precoValido(preco)) return { ok: false, error: "Informe um preço válido." };
    base.preco = preco;
  }

  if (modelo === "tamanhos") {
    const medio = parsePreco(formData.get("preco_medio"));
    const grande = parsePreco(formData.get("preco_grande"));
    if (!precoValido(medio) || !precoValido(grande)) {
      return { ok: false, error: "Informe os preços Médio e Grande." };
    }
    base.preco_medio = medio;
    base.preco_grande = grande;
  }

  if (modelo === "compartilhar") {
    const raw = String(formData.get("serve_ate") ?? "").trim();
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isInteger(n) || n <= 0) {
        return { ok: false, error: "“Serve até” deve ser um número maior que zero." };
      }
      base.serve_ate = n;
    }
  }

  return { ok: true, data: base };
}

async function aplicarImagem(
  formData: FormData,
  produtoId: string,
): Promise<{ error: string } | { imagem_path?: string }> {
  const file = formData.get("imagem");
  if (!(file instanceof File) || file.size === 0) return {};
  const res = await salvarImagemProduto(produtoId, file);
  return res.ok ? { imagem_path: res.path } : { error: res.error };
}

export async function criarProduto(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const parsed = parseProdutoForm(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { data: criado, error } = await supabase
    .from("produtos")
    .insert({
      ...parsed.data,
      ordem: await proximaOrdem("produtos", parsed.data.categoria_id),
    })
    .select("id")
    .single();

  if (error || !criado) {
    return { error: "Não foi possível criar o produto.", ok: false };
  }

  const img = await aplicarImagem(formData, criado.id);
  if ("error" in img) {
    return { error: `Produto criado, mas a imagem falhou: ${img.error}`, ok: false };
  }
  if (img.imagem_path) {
    await supabase
      .from("produtos")
      .update({ imagem_path: img.imagem_path })
      .eq("id", criado.id);
  }

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function atualizarProduto(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produto não identificado.", ok: false };

  const parsed = parseProdutoForm(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("produtos")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar o produto.", ok: false };

  if (formData.get("remover_imagem") === "true") {
    const { data } = await supabase
      .from("produtos")
      .select("imagem_path")
      .eq("id", id)
      .single();
    if (data?.imagem_path) await removerImagemProduto(data.imagem_path);
    await supabase.from("produtos").update({ imagem_path: null }).eq("id", id);
  } else {
    const img = await aplicarImagem(formData, id);
    if ("error" in img) return { error: img.error, ok: false };
    if (img.imagem_path) {
      await supabase
        .from("produtos")
        .update({ imagem_path: img.imagem_path })
        .eq("id", id);
    }
  }

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function definirStatusProduto(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("produtos").update({ ativo }).eq("id", id);
  revalidarCardapio();
}

// ===========================================================================
// Avisos
// ===========================================================================

export async function criarAviso(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return { error: "Escreva o texto do aviso.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("avisos")
    .insert({ texto, ordem: await proximaOrdem("avisos") });
  if (error) return { error: "Não foi possível criar o aviso.", ok: false };

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function atualizarAviso(
  _prev: CardapioState,
  formData: FormData,
): Promise<CardapioState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!id) return { error: "Aviso não identificado.", ok: false };
  if (!texto) return { error: "Escreva o texto do aviso.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("avisos")
    .update({ texto })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar.", ok: false };

  revalidarCardapio();
  return { error: null, ok: true };
}

export async function definirStatusAviso(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("avisos").update({ ativo }).eq("id", id);
  revalidarCardapio();
}

// ===========================================================================
// Reordenação (↑/↓) — comum às três listas
// ===========================================================================

const ORDENAVEIS = ["categorias", "produtos", "avisos"] as const;
type Ordenavel = (typeof ORDENAVEIS)[number];

/**
 * Troca a posição de um item com o vizinho de cima/baixo.
 * Concorrência entre dois administradores é aceitável para este cliente.
 */
export async function moverItem(formData: FormData): Promise<void> {
  await requireRole("admin");
  const tabela = String(formData.get("tabela") ?? "") as Ordenavel;
  const id = String(formData.get("id") ?? "");
  const direcao = String(formData.get("direcao") ?? "");
  const categoriaId = formData.get("categoria_id")
    ? String(formData.get("categoria_id"))
    : null;

  if (!ORDENAVEIS.includes(tabela) || !id) return;
  if (direcao !== "cima" && direcao !== "baixo") return;

  const supabase = await createClient();
  const { data: irmaos } =
    tabela === "produtos" && categoriaId
      ? await supabase
          .from("produtos")
          .select("id, ordem")
          .eq("categoria_id", categoriaId)
          .order("ordem", { ascending: true })
      : await supabase
          .from(tabela)
          .select("id, ordem")
          .order("ordem", { ascending: true });
  if (!irmaos) return;

  const i = irmaos.findIndex((x) => x.id === id);
  const j = direcao === "cima" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= irmaos.length) return;

  await supabase
    .from(tabela)
    .update({ ordem: irmaos[j].ordem })
    .eq("id", irmaos[i].id);
  await supabase
    .from(tabela)
    .update({ ordem: irmaos[i].ordem })
    .eq("id", irmaos[j].id);

  revalidarCardapio();
}
