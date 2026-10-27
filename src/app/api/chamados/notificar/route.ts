import { NextResponse } from "next/server";
import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Disparo de push pra garçons e administradores inscritos (bônus não
 * contratual — ver
 * docs/Push-Notificacoes-Garcom-Bonus.md). Chamado pelo próprio cliente do
 * salão (anon, sem login) logo depois que criar_chamado() responde — por
 * isso é rota pública (ver PUBLIC_PATHS em src/lib/supabase/proxy.ts) e usa
 * o cliente service_role pra ler as inscrições, ignorando RLS.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chamadoId = body?.chamadoId;
  const mesa = body?.mesa;
  if (typeof chamadoId !== "string" || typeof mesa !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    // Bônus opcional: sem chaves configuradas, só não notifica (chamado já
    // foi criado normalmente e aparece na fila via Realtime).
    return NextResponse.json({ ok: false, motivo: "push_nao_configurado" });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createAdminClient();
  // Quem está em atendimento não recebe o aviso (os demais, sim). Atendimento
  // que já passou do tempo máximo conta como encerrado — a finalização
  // automática ainda pode não ter rodado.
  const { data: config } = await supabase
    .from("fila_config")
    .select("atendimento_max_minutos")
    .eq("id", 1)
    .single();
  const limiteMs = (config?.atendimento_max_minutos ?? 10) * 60_000;
  const { data: emAtendimento } = await supabase
    .from("chamados")
    .select("garcom_id")
    .eq("status", "aceito")
    .gte("aceito_em", new Date(Date.now() - limiteMs).toISOString());
  const ocupados = new Set(
    (emAtendimento ?? []).map((c) => c.garcom_id).filter((id): id is string => !!id),
  );

  const { data: todas } = await supabase
    .from("push_inscricoes")
    .select("id, usuario_id, endpoint, p256dh, auth_key, profiles!inner(role, ativo)")
    .in("profiles.role", ["garcom", "admin", "gerente"])
    .eq("profiles.ativo", true);
  const inscricoes = (todas ?? []).filter((i) => !ocupados.has(i.usuario_id));

  const payload = JSON.stringify({ mesa, chamadoId });

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth_key },
          },
          payload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_inscricoes").delete().eq("id", inscricao.id);
        }
      }
    }),
  );

  return NextResponse.json({ ok: true, enviados: inscricoes.length });
}
