const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um número (ou string numérica) como moeda: 8.5 -> "R$ 8,50". */
export function formatarPreco(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return "—";
  return BRL.format(n);
}

/**
 * Converte a entrada de um campo de preço em número.
 * Aceita "12,50" e "12.50". Retorna null se vazio; NaN se inválido.
 */
export function parsePreco(valor: FormDataEntryValue | null): number | null {
  const s = String(valor ?? "").trim();
  if (!s) return null;
  return Number(s.replace(/\s/g, "").replace(",", "."));
}

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** "10/09 21:30" */
export function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  return DATA_HORA.format(new Date(iso));
}

const HORA_COMPLETA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** "21:30:05" */
export function formatarHora(iso: string): string {
  return HORA_COMPLETA.format(new Date(iso));
}

/** Duração curta a partir de milissegundos: "3 min", "1 h 12 min", "12 s". */
export function formatarDuracaoMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

/** Duração curta entre dois instantes ISO. "—" se algum for nulo. */
export function formatarDuracao(
  inicio: string | null,
  fim: string | null,
): string {
  if (!inicio || !fim) return "—";
  return formatarDuracaoMs(new Date(fim).getTime() - new Date(inicio).getTime());
}
