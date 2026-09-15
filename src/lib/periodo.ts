export type Periodo = "hoje" | "7d" | "30d" | "tudo";

/**
 * Início do período (ISO) a partir do valor do filtro `?periodo=`. `null` para
 * "tudo" (sem corte). Compartilhado entre Eventos (Módulo 4) e Painel
 * Gerencial (Módulo 5) — os dois recortam os mesmos `chamados` por data.
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
