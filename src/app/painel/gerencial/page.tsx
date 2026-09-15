import type { CSSProperties } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Barra } from "@/components/graficos/barra";
import { ColunasDia } from "@/components/graficos/colunas-dia";
import { carregarIndicadores } from "@/lib/gerencial";
import { formatarDuracaoMs } from "@/lib/formato";

import { PeriodoFiltro } from "./periodo-filtro";

export const metadata = { title: "Painel Gerencial — Point07" };
export const dynamic = "force-dynamic";

// Hue único validado (dataviz: sequencial, não categórico — cada gráfico aqui
// é uma métrica só fatiada por categoria, não múltiplas séries).
const VIZ_VARS = { "--viz-serie": "#2a78d6" } as CSSProperties;

export default async function PainelGerencialPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sp = await searchParams;
  const periodo = sp.periodo ?? "7d";
  const dados = await carregarIndicadores(periodo);

  const kpis = [
    {
      titulo: "Tempo médio de atendimento",
      valor:
        dados.tempoMedioMs === null ? "—" : formatarDuracaoMs(dados.tempoMedioMs),
    },
    { titulo: "Chamados no período", valor: String(dados.totalChamados) },
    {
      titulo: "% aceitos",
      valor:
        dados.totalChamados > 0
          ? `${Math.round((dados.totalAceitos / dados.totalChamados) * 100)}%`
          : "—",
    },
    { titulo: "Pendentes agora", valor: String(dados.pendentesAgora) },
  ];

  const maxGarcom = Math.max(1, ...dados.porGarcom.map((g) => g.aceitos));
  const maxTempoGarcom = Math.max(1, ...dados.porGarcom.map((g) => g.tempoMedioMs));
  const maxMesaEspera = Math.max(1, ...dados.mesasComEspera.map((m) => m.tempoMedioMs));
  const maxMesaAtendimentos = Math.max(
    1,
    ...dados.mesasPorAtendimentos.map((m) => m.aceitos),
  );

  return (
    <div style={VIZ_VARS} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Painel gerencial</h1>
        <p className="text-sm text-muted-foreground">
          Desempenho do atendimento de salão (Módulo 5) — dados do Registro de
          Eventos.
        </p>
      </div>

      <PeriodoFiltro />

      {!dados.dadosSuficientes ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          ⚠️ Poucos chamados aceitos nesse período ({dados.totalAceitos}) — os
          números abaixo podem não refletir bem o desempenho real.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.titulo}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {kpi.valor}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por garçom</CardTitle>
          <CardDescription>
            Chamados aceitos pela fila (Módulo 3) — chamado atendido fora do
            aceite exclusivo não entra aqui.
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6">
          {dados.porGarcom.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum chamado aceito no período.
            </p>
          ) : (
            dados.porGarcom.map((g) => (
              <Barra
                key={g.nome}
                rotulo={g.nome}
                valor={g.aceitos}
                maximo={maxGarcom}
              />
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tempo médio de atendimento por garçom
          </CardTitle>
          <CardDescription>
            Média entre o chamado e o aceite, por garçom.
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6">
          {dados.porGarcom.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum chamado aceito no período.
            </p>
          ) : (
            dados.porGarcom.map((g) => (
              <Barra
                key={g.nome}
                rotulo={g.nome}
                valor={g.tempoMedioMs}
                maximo={maxTempoGarcom}
                exibirValor={formatarDuracaoMs(g.tempoMedioMs)}
              />
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por dia</CardTitle>
          <CardDescription>Todos os chamados recebidos, por dia.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <ColunasDia pontos={dados.porDia} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por mesa</CardTitle>
          <CardDescription>
            Quantidade de chamados aceitos, por mesa (top 5).
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6">
          {dados.mesasPorAtendimentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum chamado aceito no período.
            </p>
          ) : (
            dados.mesasPorAtendimentos.map((m) => (
              <Barra
                key={m.identificador}
                rotulo={m.identificador}
                valor={m.aceitos}
                maximo={maxMesaAtendimentos}
              />
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mesas com maior espera</CardTitle>
          <CardDescription>
            Tempo médio entre o chamado e o aceite, por mesa (top 5).
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-6">
          {dados.mesasComEspera.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum chamado aceito no período.
            </p>
          ) : (
            dados.mesasComEspera.map((m) => (
              <Barra
                key={m.identificador}
                rotulo={m.identificador}
                valor={m.tempoMedioMs}
                maximo={maxMesaEspera}
                exibirValor={formatarDuracaoMs(m.tempoMedioMs)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
