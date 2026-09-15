"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FilaConfigState = { error: string | null; ok: boolean };

export async function salvarConfigFila(
  _prev: FilaConfigState,
  formData: FormData,
): Promise<FilaConfigState> {
  await requireRole("admin");

  const minutos = Number(formData.get("minutos"));
  const segundos = Number(formData.get("segundos"));
  if (
    !Number.isFinite(minutos) ||
    !Number.isFinite(segundos) ||
    minutos < 0 ||
    segundos < 0 ||
    segundos > 59
  ) {
    return { error: "Informe um tempo válido.", ok: false };
  }
  const total = Math.round(minutos * 60 + segundos);
  if (total <= 0) {
    return { error: "O tempo precisa ser maior que zero.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fila_config")
    .update({ alerta_atraso_segundos: total })
    .eq("id", 1);
  if (error) return { error: "Não foi possível salvar.", ok: false };

  revalidatePath("/painel/configuracoes/fila");
  revalidatePath("/fila");
  return { error: null, ok: true };
}
