export type Periodo = "hoje" | "7d" | "30d" | "tudo";

/**
 * Início do período (ISO) a partir do valor do filtro `?periodo=`. `null` para
 * "tudo" (sem corte). Compartilhado entre Eventos (Módulo 4) e Painel
 * Gerencial (Módulo 5) — os dois recortam os mesmos `chamados` por data.
 *
 * "hoje" usa `setHours(0,0,0,0)`, que é meia-noite no fuso do PROCESSO Node,
 * não um fuso fixo — depende do fuso ser fixado em `src/instrumentation.ts`
 * (produção na Vercel roda em UTC por padrão; sem isso, "hoje" começa 3h
 * adiantado e mistura o fim da noite de ontem com hoje).
 */
export function desdeQuando(periodo: string): string | null {
  const agora = new Date();
  if (periodo === "hoje") {
    agora.setHours(0, 0, 0, 0);
    return agora.toISOString();
  }
  if (periodo === "7d") return new Date(Date.now() - 7 * 864e5).toISOString();
  if (periodo === "30d") return new Date(Date.now() - 30 * 864e5).toISOString();
  return null;
}
