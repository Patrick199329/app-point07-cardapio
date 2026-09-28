/**
 * Roda uma vez quando uma nova instância do servidor Next.js inicia, antes de
 * atender qualquer request (ver node_modules/next/dist/docs/.../instrumentation.md).
 *
 * Único jeito de fixar o fuso horário do servidor em produção: a Vercel roda
 * os Serverless Functions em UTC por padrão e `TZ` é nome de variável de
 * ambiente RESERVADO lá (não dá pra configurar pelo painel/CLI — tentar dá
 * erro "reserved"). Formatação de data/hora e agrupamento de chamados por dia
 * (src/lib/formato.ts, periodo.ts, gerencial.ts) usam `Date`/`Intl` sem fuso
 * explícito, que resolvem pro fuso do processo — sem isso, tudo aparece 3h
 * adiantado em produção (e o filtro/gráfico "hoje" mistura o fim da noite de
 * ontem com hoje). Brasil não tem mais horário de verão desde 2019, então um
 * fuso fixo (via nome IANA, não offset cru) é seguro o ano todo.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Sao_Paulo";
  }
}
