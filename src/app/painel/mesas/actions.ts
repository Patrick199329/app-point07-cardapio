"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type MesaState = { error: string | null; ok: boolean };

const AREAS = ["interna", "externa"] as const;
type Area = (typeof AREAS)[number];

type MesaInput = { identificador: string; apelido: string | null; area: Area };
type ParseResult =
  | { ok: false; error: string }
  | { ok: true; data: MesaInput };

function parseMesaForm(formData: FormData): ParseResult {
  const identificador = String(formData.get("identificador") ?? "").trim();
  const apelidoRaw = String(formData.get("apelido") ?? "").trim();
  const area = String(formData.get("area") ?? "interna");

  if (!identificador) {
    return { ok: false, error: "Informe o identificador da mesa." };
  }
  if (!AREAS.includes(area as Area)) {
    return { ok: false, error: "Área inválida." };
  }
  return {
    ok: true,
    data: { identificador, apelido: apelidoRaw || null, area: area as Area },
  };
}

/**
 * Liga/desliga o QR universal. NÃO troca o token (o QR impresso continua o
 * mesmo ao religar) — de propósito não existe ação de gerar token novo.
 */
export async function alternarQrUniversal(ativo: boolean): Promise<MesaState> {
  await requireAnyRole(["admin", "gerente"]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("qr_universal")
    .update({ ativo })
    .eq("id", 1);
  if (error) return { error: "Não foi possível alterar o QR universal.", ok: false };

  revalidatePath("/painel/mesas/impressao");
  return { error: null, ok: true };
}

export async function criarMesa(
  _prev: MesaState,
  formData: FormData,
): Promise<MesaState> {
  await requireAnyRole(["admin", "gerente"]);

  const parsed = parseMesaForm(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("mesas").insert(parsed.data);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma mesa com esse identificador.", ok: false };
    }
    return { error: "Não foi possível criar a mesa.", ok: false };
  }

  revalidatePath("/painel/mesas");
  return { error: null, ok: true };
}

export async function atualizarMesa(
  _prev: MesaState,
  formData: FormData,
): Promise<MesaState> {
  await requireAnyRole(["admin", "gerente"]);

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Mesa não identificada.", ok: false };

  const parsed = parseMesaForm(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mesas")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma mesa com esse identificador.", ok: false };
    }
    return { error: "Não foi possível salvar as alterações.", ok: false };
  }

  revalidatePath("/painel/mesas");
  return { error: null, ok: true };
}

/** Ativa/desativa uma mesa. Usada diretamente como `action` de um <form>. */
export async function definirStatusMesa(formData: FormData): Promise<void> {
  await requireAnyRole(["admin", "gerente"]);

  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("mesas").update({ ativo }).eq("id", id);
  revalidatePath("/painel/mesas");
}
