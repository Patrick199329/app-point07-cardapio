"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OpcoesState = { error: string | null; ok: boolean };

function revalidar(produtoId: string) {
  revalidatePath(`/painel/cardapio/produtos/${produtoId}/opcoes`);
  revalidatePath("/painel/cardapio", "layout");
  revalidatePath("/cardapio");
}

async function proximaOrdemGrupo(produtoId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produto_grupos_opcoes")
    .select("ordem")
    .eq("produto_id", produtoId)
    .order("ordem", { ascending: false })
    .limit(1);
  return (data?.[0]?.ordem ?? -1) + 1;
}

export async function criarGrupo(
  _prev: OpcoesState,
  formData: FormData,
): Promise<OpcoesState> {
  await requireRole("admin");
  const produtoId = String(formData.get("produto_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!produtoId) return { error: "Produto não identificado.", ok: false };
  if (!titulo) return { error: "Informe o título do grupo.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("produto_grupos_opcoes").insert({
    produto_id: produtoId,
    titulo,
    observacao,
    ordem: await proximaOrdemGrupo(produtoId),
  });
  if (error) return { error: "Não foi possível criar o grupo.", ok: false };

  revalidar(produtoId);
  return { error: null, ok: true };
}

export async function atualizarGrupo(
  _prev: OpcoesState,
  formData: FormData,
): Promise<OpcoesState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!id) return { error: "Grupo não identificado.", ok: false };
  if (!titulo) return { error: "Informe o título do grupo.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("produto_grupos_opcoes")
    .update({ titulo, observacao })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar.", ok: false };

  revalidar(produtoId);
  return { error: null, ok: true };
}

/** Exclui o grupo (cascade remove as opções dele). */
export async function excluirGrupo(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("produto_grupos_opcoes").delete().eq("id", id);
  revalidar(produtoId);
}

export async function adicionarOpcao(formData: FormData): Promise<void> {
  await requireRole("admin");
  const grupoId = String(formData.get("grupo_id") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!grupoId || !nome) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("produto_opcoes")
    .select("ordem")
    .eq("grupo_id", grupoId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (data?.[0]?.ordem ?? -1) + 1;

  await supabase.from("produto_opcoes").insert({ grupo_id: grupoId, nome, ordem });
  revalidar(produtoId);
}

export async function removerOpcao(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const produtoId = String(formData.get("produto_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("produto_opcoes").delete().eq("id", id);
  revalidar(produtoId);
}
