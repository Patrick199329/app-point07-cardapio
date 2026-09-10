import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function homePathForRole(role: UserRole) {
  return role === "admin" ? "/painel" : "/fila";
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  garcom: "Garçom",
};

/**
 * Retorna o usuário autenticado e seu profile, ou null se não houver sessão
 * válida / o profile estiver inativo.
 */
export async function getProfile(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;
  profile: Profile;
} | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.ativo) return null;
  return { user, profile };
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Exige sessão válida. Redireciona para /login caso contrário. */
export async function requireProfile() {
  const result = await getProfile();
  if (!result) redirect("/login");
  return result;
}

/**
 * Exige um perfil específico. Se autenticado com o perfil errado, manda para a
 * home do perfil correto (garçom não acessa /painel; admin não fica em /fila).
 */
export async function requireRole(role: UserRole) {
  const result = await requireProfile();
  if (result.profile.role !== role) {
    redirect(homePathForRole(result.profile.role));
  }
  return result;
}
