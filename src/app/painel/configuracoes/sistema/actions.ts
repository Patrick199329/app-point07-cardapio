"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireRole } from "@/lib/auth";
import {
  removerImagemProduto,
  salvarFaviconSistema,
  salvarLogoSistema,
} from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

export type SistemaState = { error: string | null; ok: boolean };

function revalidarTudo() {
  revalidatePath("/painel/configuracoes/sistema");
  revalidatePath("/login");
  revalidatePath("/painel", "layout");
  revalidatePath("/fila");
  revalidateTag("branding", { expire: 0 });
}

export async function salvarIdentidadeSistema(
  _prev: SistemaState,
  formData: FormData,
): Promise<SistemaState> {
  await requireRole("admin");

  const supabase = await createClient();
  const update: { logo_path?: string | null; favicon_path?: string | null } = {};

  if (formData.get("remover_logo") === "true") {
    const { data } = await supabase
      .from("sistema_config")
      .select("logo_path")
      .eq("id", 1)
      .single();
    if (data?.logo_path) await removerImagemProduto(data.logo_path);
    update.logo_path = null;
  } else {
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      const res = await salvarLogoSistema(file);
      if (!res.ok) return { error: res.error, ok: false };
      update.logo_path = res.path;
    }
  }

  if (formData.get("remover_favicon") === "true") {
    const { data } = await supabase
      .from("sistema_config")
      .select("favicon_path")
      .eq("id", 1)
      .single();
    if (data?.favicon_path) await removerImagemProduto(data.favicon_path);
    update.favicon_path = null;
  } else {
    const file = formData.get("favicon");
    if (file instanceof File && file.size > 0) {
      const res = await salvarFaviconSistema(file);
      if (!res.ok) return { error: res.error, ok: false };
      update.favicon_path = res.path;
    }
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from("sistema_config")
      .update(update)
      .eq("id", 1);
    if (error) return { error: "Não foi possível salvar.", ok: false };
  }

  revalidarTudo();
  return { error: null, ok: true };
}
