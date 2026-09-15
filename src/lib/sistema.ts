import { createClient } from "@/lib/supabase/server";
import { urlImagemProduto } from "@/lib/imagem";

/**
 * Logo interna do sistema (login, sidebar do painel, cabeçalho do garçom).
 * Leitura pública (RLS de `sistema_config`) — funciona até em `/login`, sem
 * sessão. `null` quando não há logo configurada (as telas caem no texto
 * "Point07" como fallback).
 */
export async function carregarLogoSistema(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sistema_config")
    .select("logo_path, updated_at")
    .eq("id", 1)
    .single();

  const url = urlImagemProduto(data?.logo_path ?? null);
  if (!url) return null;
  return `${url}?v=${encodeURIComponent(data!.updated_at)}`;
}
