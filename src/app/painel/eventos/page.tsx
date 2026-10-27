import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarDataHora,
  formatarDuracao,
  formatarDuracaoMs,
} from "@/lib/formato";
import { desdeQuando } from "@/lib/periodo";
import { createClient } from "@/lib/supabase/server";

import { EventosFiltros } from "./eventos-filtros";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

type StatusChamado = "pendente" | "aceito" | "cancelado" | "finalizado";

const STATUS: Record<
  StatusChamado,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pendente: { label: "Pendente", variant: "outline" },
  aceito: { label: "Em atendimento", variant: "default" },
  finalizado: { label: "Finalizado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};

type Chamado = {
  id: string;
  status: StatusChamado;
  criado_em: string;
  aceito_em: string | null;
  finalizado_em: string | null;
  finalizado_auto: boolean;
  mesas: { identificador: string } | null;
  profiles: { nome: string } | null;
};

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    status?: string;
    garcom?: string;
    mesa?: string;
  }>;
}) {
  const sp = await searchParams;
  const periodo = sp.periodo ?? "7d";
  const supabase = await createClient();

  const [garconsRes, mesasRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome")
      .eq("role", "garcom")
      .order("nome"),
    supabase.from("mesas").select("id, identificador").order("identificador"),
  ]);

  let query = supabase
    .from("chamados")
    .select(
      "id, status, criado_em, aceito_em, finalizado_em, finalizado_auto, mesas(identificador), profiles(nome)",
    )
    .order("criado_em", { ascending: false })
    .limit(300);

  const desde = desdeQuando(periodo);
  if (desde) query = query.gte("criado_em", desde);
  if (
    sp.status === "pendente" ||
    sp.status === "aceito" ||
    sp.status === "finalizado" ||
    sp.status === "cancelado"
  ) {
    query = query.eq("status", sp.status);
  }
  if (sp.garcom && sp.garcom !== "all") query = query.eq("garcom_id", sp.garcom);
  if (sp.mesa && sp.mesa !== "all") query = query.eq("mesa_id", sp.mesa);

  const { data } = await query;
  const chamados = (data ?? []) as unknown as Chamado[];

  const aceitos = chamados.filter(
    (c) => c.status === "aceito" || c.status === "finalizado",
  );
  const esperaMedia =
    aceitos.length > 0
      ? aceitos.reduce(
          (soma, c) =>
            soma +
            (new Date(c.aceito_em!).getTime() -
              new Date(c.criado_em).getTime()),
          0,
        ) / aceitos.length
      : null;

  // Duração só das finalizações manuais (a automática não mede o atendimento).
  const duracoes = chamados
    .filter((c) => c.status === "finalizado" && !c.finalizado_auto && c.finalizado_em)
    .map(
      (c) =>
        new Date(c.finalizado_em!).getTime() - new Date(c.aceito_em!).getTime(),
    );
  const atendimentoMedio =
    duracoes.length > 0
      ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de chamados de garçom (Módulo 4).
        </p>
      </div>

      <EventosFiltros
        garcons={garconsRes.data ?? []}
        mesas={mesasRes.data ?? []}
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>{chamados.length} chamado(s)</span>
        <span>{aceitos.length} aceito(s)</span>
        <span>
          Espera média:{" "}
          {esperaMedia === null ? "—" : formatarDuracaoMs(esperaMedia)}
        </span>
        <span>
          Atendimento médio:{" "}
          {atendimentoMedio === null ? "—" : formatarDuracaoMs(atendimentoMedio)}
        </span>
      </div>

      {chamados.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum chamado no período selecionado.
        </p>
      ) : (
        <>
          {/* Mobile */}
          <ul className="space-y-3 md:hidden">
            {chamados.map((c) => (
              <li key={c.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">
                    {c.mesas?.identificador ?? "Mesa"}
                  </p>
                  <Badge variant={STATUS[c.status].variant}>
                    {STATUS[c.status].label}
                  </Badge>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <dt>Chamado</dt>
                  <dd className="text-right text-foreground">
                    {formatarDataHora(c.criado_em)}
                  </dd>
                  <dt>Aceito</dt>
                  <dd className="text-right text-foreground">
                    {formatarDataHora(c.aceito_em)}
                  </dd>
                  <dt>Garçom</dt>
                  <dd className="text-right text-foreground">
                    {c.profiles?.nome ?? "—"}
                  </dd>
                  <dt>Espera</dt>
                  <dd className="text-right text-foreground">
                    {formatarDuracao(c.criado_em, c.aceito_em)}
                  </dd>
                  <dt>Finalizado</dt>
                  <dd className="text-right text-foreground">
                    {formatarDataHora(c.finalizado_em)}
                    {c.finalizado_auto ? " (auto)" : ""}
                  </dd>
                  <dt>Atendimento</dt>
                  <dd className="text-right text-foreground">
                    {formatarDuracao(c.aceito_em, c.finalizado_em)}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>

          {/* Desktop */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Chamado</TableHead>
                  <TableHead>Aceito</TableHead>
                  <TableHead>Garçom</TableHead>
                  <TableHead>Espera</TableHead>
                  <TableHead>Finalizado</TableHead>
                  <TableHead>Atendimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chamados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.mesas?.identificador ?? "Mesa"}
                    </TableCell>
                    <TableCell>{formatarDataHora(c.criado_em)}</TableCell>
                    <TableCell>{formatarDataHora(c.aceito_em)}</TableCell>
                    <TableCell>{c.profiles?.nome ?? "—"}</TableCell>
                    <TableCell>
                      {formatarDuracao(c.criado_em, c.aceito_em)}
                    </TableCell>
                    <TableCell>
                      {formatarDataHora(c.finalizado_em)}
                      {c.finalizado_auto ? " (auto)" : ""}
                    </TableCell>
                    <TableCell>
                      {formatarDuracao(c.aceito_em, c.finalizado_em)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS[c.status].variant}>
                        {STATUS[c.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
