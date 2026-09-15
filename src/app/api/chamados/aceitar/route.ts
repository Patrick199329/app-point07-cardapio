import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Aceite disparado pela ação "Aceitar" da notificação push (bônus — ver
 * docs/Push-Notificacoes-Garcom-Bonus.md), fora da UI de /fila. Não usa
 * requireRole() (que faz redirect(), inadequado pra uma resposta JSON de
 * service worker) — a autorização final é a mesma RPC aceitar_chamado usada
 * em /fila, que já checa is_admin()/is_garcom() e o aceite exclusivo.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chamadoId = body?.chamadoId;
  if (typeof chamadoId !== "string") {
    return NextResponse.json({ ok: false, motivo: "chamado_invalido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, motivo: "sem_sessao" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("aceitar_chamado", { p_id: chamadoId });
  if (error) {
    return NextResponse.json({ ok: false, motivo: "erro" }, { status: 500 });
  }
  return NextResponse.json(data?.[0] ?? { ok: false, motivo: "erro" });
}
