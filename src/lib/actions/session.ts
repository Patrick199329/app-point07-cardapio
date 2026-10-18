"use server";

import { redirect } from "next/navigation";

import { registrarAuditoria } from "@/lib/auditoria";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  // Registra antes de signOut() — depois a sessão já era, auth.uid() some.
  await registrarAuditoria(supabase, { tipo: "saida" });
  await supabase.auth.signOut();
  redirect("/login");
}
