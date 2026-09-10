"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UsuarioState = { error: string | null; ok: boolean };

const ROLES = ["admin", "garcom"] as const;
type Role = (typeof ROLES)[number];

export async function criarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  await requireRole("admin");

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const role = String(formData.get("role") ?? "garcom");

  if (!nome) return { error: "Informe o nome.", ok: false };
  if (!email.includes("@")) return { error: "E-mail inválido.", ok: false };
  if (senha.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres.", ok: false };
  }
  if (!ROLES.includes(role as Role)) {
    return { error: "Perfil inválido.", ok: false };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role },
  });

  if (error) {
    if (
      error.status === 422 ||
      error.code === "email_exists" ||
      /already|exist/i.test(error.message)
    ) {
      return { error: "Já existe um usuário com esse e-mail.", ok: false };
    }
    return { error: "Não foi possível criar o usuário.", ok: false };
  }

  revalidatePath("/painel/usuarios");
  return { error: null, ok: true };
}

export async function atualizarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  const { user } = await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const role = String(formData.get("role") ?? "garcom");

  if (!id) return { error: "Usuário não identificado.", ok: false };
  if (!nome) return { error: "Informe o nome.", ok: false };
  if (!ROLES.includes(role as Role)) {
    return { error: "Perfil inválido.", ok: false };
  }
  if (id === user.id && role !== "admin") {
    return {
      error: "Você não pode rebaixar o seu próprio perfil de Administrador.",
      ok: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nome, role: role as Role })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar as alterações.", ok: false };
  }

  revalidatePath("/painel/usuarios");
  return { error: null, ok: true };
}

/** Ativa/desativa um usuário. Usada diretamente como `action` de um <form>. */
export async function definirStatusUsuario(formData: FormData): Promise<void> {
  const { user } = await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id || id === user.id) return; // ninguém desativa a si mesmo

  const supabase = await createClient();
  await supabase.from("profiles").update({ ativo }).eq("id", id);
  revalidatePath("/painel/usuarios");
}
