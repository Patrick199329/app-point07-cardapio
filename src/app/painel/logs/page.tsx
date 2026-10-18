import { requireAdminInnovation } from "@/lib/auth";
import { AREA_GRUPOS, type AuditoriaTipo, type LogAuditoria } from "@/lib/auditoria";
import { createClient } from "@/lib/supabase/server";

import { LogsFiltros } from "./logs-filtros";
import { LogsLista } from "./logs-lista";

export const metadata = { title: "Logs de auditoria" };
export const dynamic = "force-dynamic";

const TIPOS_VALIDOS: AuditoriaTipo[] = ["criacao", "edicao", "exclusao", "entrada", "saida"];

/**
 * Terceiro nível de admin (Innovation) — ver requireAdminInnovation() em
 * src/lib/auth.ts. Não aparece pro admin/gerente do cliente final.
 */
export default async function LogsAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; tipo?: string }>;
}) {
  await requireAdminInnovation();

  const { area, tipo } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("logs_auditoria")
    .select("*, profiles(nome)")
    .order("criado_em", { ascending: false })
    .limit(300);

  const grupo = AREA_GRUPOS.find((g) => g.key === area);
  if (grupo) {
    if (grupo.key === "sessao") query = query.is("tabela", null);
    else query = query.in("tabela", grupo.tabelas);
  }
  if (tipo && TIPOS_VALIDOS.includes(tipo as AuditoriaTipo)) {
    query = query.eq("tipo", tipo as AuditoriaTipo);
  }

  const { data } = await query;
  const logs = (data ?? []) as unknown as (LogAuditoria & { profiles: { nome: string } | null })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Logs de auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Criação, edição, exclusão e entrada/saída em usuários, mesas, cardápio e configurações —
          os últimos 300 eventos. Visível só pra quem desenvolve a plataforma.
        </p>
      </div>

      <LogsFiltros />
      <LogsLista logs={logs} />
    </div>
  );
}
