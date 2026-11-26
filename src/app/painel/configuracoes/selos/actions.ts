"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth";
import { marcarRascunhoAlterado } from "@/lib/cardapio-publicacao";
import { createClient } from "@/lib/supabase/server";

export type SeloState = { error: string | null; ok: boolean };

const CORES = ["laranja", "preto"] as const;
type Cor = (typeof CORES)[number];
const TEXTO_MAX = 24;

// Selo mudou (texto, cor, ativo, exclusão): o painel reflete na hora, o cardápio público só
// depois do "Publicar" — então acende o botão (marcarRascunhoAlterado).
async function aposMudanca() {
  revalidatePath("/painel", "layout");
  await marcarRascunhoAlterado();
}

type ParseResult =
  | { ok: false; error: string }
  | { ok: true; texto: string; cor: Cor };

function lerFormulario(formData: FormData): ParseResult {
  // Espaços repetidos viram um só ("Mais   vendido " → "Mais vendido").
  const texto = String(formData.get("texto") ?? "").replace(/\s+/g, " ").trim();
  const cor = String(formData.get("cor") ?? "laranja");
  if (!texto) return { ok: false, error: "Informe o texto do selo." };
  if (texto.length > TEXTO_MAX) {
    return { ok: false, error: `O texto pode ter no máximo ${TEXTO_MAX} caracteres.` };
  }
  if (!CORES.includes(cor as Cor)) return { ok: false, error: "Cor inválida." };
  return { ok: true, texto, cor: cor as Cor };
}

export async function criarSelo(_prev: SeloState, formData: FormData): Promise<SeloState> {
  await requireAnyRole(["admin", "gerente"]);
  const parsed = lerFormulario(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("selos")
    .insert({ texto: parsed.texto, cor: parsed.cor });
  if (error) {
    if (error.code === "23505") return { error: "Já existe um selo com esse texto.", ok: false };
    return { error: "Não foi possível criar o selo.", ok: false };
  }
  await aposMudanca();
  return { error: null, ok: true };
}

export async function atualizarSelo(_prev: SeloState, formData: FormData): Promise<SeloState> {
  await requireAnyRole(["admin", "gerente"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Selo não identificado.", ok: false };
  const parsed = lerFormulario(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("selos")
    .update({ texto: parsed.texto, cor: parsed.cor })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "Já existe um selo com esse texto.", ok: false };
    return { error: "Não foi possível salvar o selo.", ok: false };
  }
  await aposMudanca();
  return { error: null, ok: true };
}

export async function definirStatusSelo(formData: FormData): Promise<void> {
  await requireAnyRole(["admin", "gerente"]);
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("selos").update({ ativo }).eq("id", id);
  await aposMudanca();
}

/** Exclui o selo; os produtos que o usavam ficam sem selo (o produto em si não é apagado). */
export async function excluirSelo(formData: FormData): Promise<SeloState> {
  await requireAnyRole(["admin", "gerente"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Selo inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("selos").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o selo.", ok: false };

  await aposMudanca();
  return { error: null, ok: true };
}
