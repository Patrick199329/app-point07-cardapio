import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Cliente Supabase com a chave service_role. IGNORA RLS — usar somente no
 * servidor e apenas para operações que exigem privilégio de administrador do
 * projeto (ex.: criar/remover usuários no Auth). Nunca importar em Client
 * Components.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente.");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
