"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type InscricaoPush = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function salvarInscricaoPush(sub: InscricaoPush, userAgent: string) {
  const { user } = await requireRole("garcom");
  const supabase = await createClient();

  const { error } = await supabase.from("push_inscricoes").upsert(
    {
      usuario_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth_key: sub.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
}

export async function removerInscricaoPush(endpoint: string) {
  const { user } = await requireRole("garcom");
  const supabase = await createClient();

  await supabase
    .from("push_inscricoes")
    .delete()
    .eq("usuario_id", user.id)
    .eq("endpoint", endpoint);
}
