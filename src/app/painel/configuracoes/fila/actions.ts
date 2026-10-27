"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FilaConfigState = { error: string | null; ok: boolean };

export async function salvarConfigFila(
  _prev: FilaConfigState,
  formData: FormData,
): Promise<FilaConfigState> {
  await requireAnyRole(["admin", "gerente"]);

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

  const atendimentoMinutos = Number(formData.get("atendimento_minutos"));
  if (
    !Number.isInteger(atendimentoMinutos) ||
    atendimentoMinutos < 1 ||
    atendimentoMinutos > 240
  ) {
    return {
      error: "Informe o tempo máximo de atendimento (1 a 240 minutos).",
      ok: false,
    };
  }

  const intervaloSegundos = Number(formData.get("intervalo_segundos"));
  if (
    !Number.isInteger(intervaloSegundos) ||
    intervaloSegundos < 0 ||
    intervaloSegundos > 3600
  ) {
    return {
      error: "Informe o intervalo entre chamados (0 a 3600 segundos).",
      ok: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fila_config")
    .update({
      alerta_atraso_segundos: total,
      atendimento_max_minutos: atendimentoMinutos,
      intervalo_novo_chamado_segundos: intervaloSegundos,
    })
    .eq("id", 1);
  if (error) return { error: "Não foi possível salvar.", ok: false };

  revalidatePath("/painel/configuracoes/fila");
  revalidatePath("/fila");
  return { error: null, ok: true };
}
