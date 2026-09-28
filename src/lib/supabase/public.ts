import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Cliente Supabase para leituras 100% públicas e sem sessão (ex.: o cardápio
 * público em /cardapio e /mesa/[token]) — mesma chave anon do cliente
 * cookie-aware (`@/lib/supabase/server.ts`), mas sem chamar `cookies()`.
 *
 * Por que isso importa pra performance: qualquer chamada a `cookies()`/
 * `headers()` durante a renderização força a rota inteira a ser dinâmica no
 * Next.js, mesmo que a página não precise de nada específico da sessão — que
 * é exatamente o caso do cardápio público (RLS já entrega os mesmos dados
 * pra `anon`, com ou sem cookie). Usar esse cliente aqui é o que permite
 * `/cardapio` ser cacheado (ver `export const revalidate` em
 * src/app/cardapio/page.tsx) em vez de bater no Supabase a cada request.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
