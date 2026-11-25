import "server-only";

import { createPublicClient } from "@/lib/supabase/public";

/**
 * Se a chamada de garçom pelo cardápio está ligada (`fila_config.chamada_garcom_ativa`,
 * Configurações → Fila do garçom). `fila_config` não é legível pelo público, então a
 * pergunta vai por uma RPC que devolve só esse booleano.
 *
 * Em caso de erro (ex.: banco ainda sem a função), segue como estava: ligada.
 * Quem barra de verdade é `criar_chamado()` no banco.
 */
export async function chamadaGarcomAtiva(): Promise<boolean> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("chamada_garcom_ativa");
  if (error || data === null) return true;
  return data;
}
