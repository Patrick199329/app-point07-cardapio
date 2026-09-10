"use server";

import { redirect } from "next/navigation";

import { getProfile, homePathForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  const result = await getProfile();
  if (!result) {
    await supabase.auth.signOut();
    return {
      error: "Este acesso está inativo. Procure o administrador do Point07.",
    };
  }

  redirect(homePathForRole(result.profile.role));
}
