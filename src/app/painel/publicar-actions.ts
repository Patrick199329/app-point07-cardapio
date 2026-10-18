"use server";

import { revalidatePath } from "next/cache";

import { carregarCardapioPublico } from "@/lib/cardapio";
import { requireAnyRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PublicarState = { error: string | null; ok: boolean };

/**
 * Tira a "foto" atual do cardápio (igual o público veria, calculado das
 * tabelas ao vivo) e grava em `cardapio_publicado` — é essa foto que o
 * cardápio público lê, não as tabelas direto. Até aqui ser chamado, as
 * edições do Administrador ficam só no painel.
 */
export async function publicarCardapio(
  _prev: PublicarState,
  _formData: FormData,
): Promise<PublicarState> {
  const { user } = await requireAnyRole(["admin", "gerente"]);

  const dados = await carregarCardapioPublico();
  const supabase = await createClient();

  const { error } = await supabase
    .from("cardapio_publicado")
    .update({
      dados,
      publicado_em: new Date().toISOString(),
      publicado_por: user.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "Não foi possível publicar o cardápio.", ok: false };
  }

  revalidatePath("/cardapio");
  revalidatePath("/painel", "layout");
  return { error: null, ok: true };
}

/** Lido pelo cabeçalho do painel pra saber se o botão "Publicar" acende. */
export async function temAlteracoesPendentes(): Promise<boolean> {
  const supabase = await createClient();
  const [{ data: rascunho }, { data: publicado }] = await Promise.all([
    supabase.from("cardapio_rascunho_status").select("alterado_em").eq("id", 1).single(),
    supabase.from("cardapio_publicado").select("publicado_em").eq("id", 1).single(),
  ]);
  if (!rascunho || !publicado) return false;
  return new Date(rascunho.alterado_em) > new Date(publicado.publicado_em);
}
