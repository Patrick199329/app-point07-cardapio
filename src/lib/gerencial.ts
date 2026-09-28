import { desdeQuando } from "@/lib/periodo";
import { createClient } from "@/lib/supabase/server";

const LIMIAR_DADOS_SUFICIENTES = 5;
const MAX_DIAS_GRAFICO = 31;

export type IndicadoresGerenciais = {
  totalChamados: number;
  totalAceitos: number;
  pendentesAgora: number;
  tempoMedioMs: number | null;
  porGarcom: { nome: string; aceitos: number; tempoMedioMs: number }[];
  porDia: { dia: string; rotulo: string; valor: number }[];
  mesasComEspera: { identificador: string; tempoMedioMs: number; amostras: number }[];
  mesasPorAtendimentos: { identificador: string; aceitos: number }[];
  /** Poucos chamados aceitos no período — os números podem não ser confiáveis. */
  dadosSuficientes: boolean;
};

type ChamadoRow = {
  status: "pendente" | "aceito" | "cancelado";
  criado_em: string;
  aceito_em: string | null;
  mesas: { identificador: string } | null;
  profiles: { nome: string } | null;
};

// getFullYear/getMonth/getDate/setHours usam o fuso do PROCESSO Node, não um
// fuso fixo — dependem do fuso ser fixado em src/instrumentation.ts (ver
// também src/lib/periodo.ts). Sem isso, produção na Vercel (UTC por padrão)
// agrupa cada chamado 3h adiantado no dia errado.
function chaveDiaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inicioDoDia(d: Date): Date {
  const copia = new Date(d);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function construirSeriePorDia(
  chamados: Pick<ChamadoRow, "criado_em">[],
  desde: string | null,
): IndicadoresGerenciais["porDia"] {
  const hoje = inicioDoDia(new Date());
  let inicio = desde
    ? inicioDoDia(new Date(desde))
    : chamados.length > 0
      ? inicioDoDia(new Date(chamados[0].criado_em))
      : new Date(hoje);

  const diasTotais = Math.round((hoje.getTime() - inicio.getTime()) / 864e5) + 1;
  if (diasTotais > MAX_DIAS_GRAFICO) {
    inicio = new Date(hoje.getTime() - (MAX_DIAS_GRAFICO - 1) * 864e5);
  }

  const contagem = new Map<string, number>();
  for (const c of chamados) {
    const chave = chaveDiaLocal(new Date(c.criado_em));
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const pontos: IndicadoresGerenciais["porDia"] = [];
  const cursor = new Date(inicio);
  while (cursor <= hoje) {
    const chave = chaveDiaLocal(cursor);
    pontos.push({
      dia: chave,
      rotulo: cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valor: contagem.get(chave) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return pontos;
}

/**
 * Agrega os indicadores do Módulo 5 a partir de `chamados` (mesma tabela do
 * Módulo 4 — ver `src/app/painel/eventos/page.tsx`). Dataset de um único
 * restaurante: agrega em JS, sem RPC.
 */
export async function carregarIndicadores(
  periodo: string,
): Promise<IndicadoresGerenciais> {
  const supabase = await createClient();
  const desde = desdeQuando(periodo);

  let query = supabase
    .from("chamados")
    .select("status, criado_em, aceito_em, mesas(identificador), profiles(nome)")
    .order("criado_em", { ascending: true });
  if (desde) query = query.gte("criado_em", desde);

  const [{ data }, pendentesRes] = await Promise.all([
    query,
    supabase
      .from("chamados")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
  ]);

  const chamados = (data ?? []) as unknown as ChamadoRow[];
  const aceitos = chamados.filter(
    (c): c is ChamadoRow & { aceito_em: string } =>
      c.status === "aceito" && c.aceito_em !== null,
  );

  const tempoMedioMs =
    aceitos.length > 0
      ? aceitos.reduce(
          (soma, c) =>
            soma +
            (new Date(c.aceito_em).getTime() - new Date(c.criado_em).getTime()),
          0,
        ) / aceitos.length
      : null;

  const porGarcomMap = new Map<string, { aceitos: number; somaMs: number }>();
  for (const c of aceitos) {
    const nome = c.profiles?.nome ?? "—";
    const ms = new Date(c.aceito_em).getTime() - new Date(c.criado_em).getTime();
    const atual = porGarcomMap.get(nome) ?? { aceitos: 0, somaMs: 0 };
    atual.aceitos += 1;
    atual.somaMs += ms;
    porGarcomMap.set(nome, atual);
  }
  const porGarcom = [...porGarcomMap.entries()]
    .map(([nome, g]) => ({ nome, aceitos: g.aceitos, tempoMedioMs: g.somaMs / g.aceitos }))
    .sort((a, b) => b.aceitos - a.aceitos);

  const mesaMap = new Map<string, { somaMs: number; amostras: number }>();
  for (const c of aceitos) {
    const identificador = c.mesas?.identificador ?? "Mesa";
    const ms =
      new Date(c.aceito_em).getTime() - new Date(c.criado_em).getTime();
    const atual = mesaMap.get(identificador) ?? { somaMs: 0, amostras: 0 };
    atual.somaMs += ms;
    atual.amostras += 1;
    mesaMap.set(identificador, atual);
  }
  const mesasComEspera = [...mesaMap.entries()]
    .map(([identificador, m]) => ({
      identificador,
      tempoMedioMs: m.somaMs / m.amostras,
      amostras: m.amostras,
    }))
    .sort((a, b) => b.tempoMedioMs - a.tempoMedioMs);
  const mesasPorAtendimentos = [...mesaMap.entries()]
    .map(([identificador, m]) => ({ identificador, aceitos: m.amostras }))
    .sort((a, b) => b.aceitos - a.aceitos);

  return {
    totalChamados: chamados.length,
    totalAceitos: aceitos.length,
    pendentesAgora: pendentesRes.count ?? 0,
    tempoMedioMs,
    porGarcom,
    porDia: construirSeriePorDia(chamados, desde),
    mesasComEspera,
    mesasPorAtendimentos,
    dadosSuficientes: aceitos.length >= LIMIAR_DADOS_SUFICIENTES,
  };
}
