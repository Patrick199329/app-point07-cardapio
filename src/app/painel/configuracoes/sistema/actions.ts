"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { removerImagemProduto, salvarLogoSistema } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

export type SistemaState = { error: string | null; ok: boolean };

function revalidarTudo() {
  revalidatePath("/painel/configuracoes/sistema");
  revalidatePath("/login");
  revalidatePath("/painel", "layout");
  revalidatePath("/fila");
}

export async function salvarLogoDoSistema(
  _prev: SistemaState,
  formData: FormData,
): Promise<SistemaState> {
  await requireRole("admin");

  const supabase = await createClient();

  if (formData.get("remover_logo") === "true") {
    const { data } = await supabase
      .from("sistema_config")
      .select("logo_path")
      .eq("id", 1)
      .single();
    if (data?.logo_path) await removerImagemProduto(data.logo_path);
    const { error } = await supabase
      .from("sistema_config")
      .update({ logo_path: null })
      .eq("id", 1);
    if (error) return { error: "Não foi possível remover a logo.", ok: false };
    revalidarTudo();
    return { error: null, ok: true };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de imagem.", ok: false };
  }

  const res = await salvarLogoSistema(file);
  if (!res.ok) return { error: res.error, ok: false };

  const { error } = await supabase
    .from("sistema_config")
    .update({ logo_path: res.path })
    .eq("id", 1);
  if (error) return { error: "Não foi possível salvar a logo.", ok: false };

  revalidarTudo();
  return { error: null, ok: true };
}
