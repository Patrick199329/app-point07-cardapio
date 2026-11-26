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

const VALOR = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Só o valor, sem o símbolo da moeda: 8.5 -> "8,50". Usado no cardápio público
 * (pedido do cliente); o painel segue mostrando "R$" via `formatarPreco`.
 */
export function formatarValor(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return "—";
  return VALOR.format(n);
}

const BRL_INTEIRO = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const VALOR_INTEIRO = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export type OpcoesFormatoPreco = {
  /** Mostra o "R$" antes do valor. */
  simbolo: boolean;
  /** 12,00 vira 12; 12,50 continua 12,50. */
  semCentavosZerados: boolean;
};

/** Preço do cardápio público conforme as opções de Configurações → Aparência. */
export function formatarPrecoPublico(
  valor: number | string | null | undefined,
  { simbolo, semCentavosZerados }: OpcoesFormatoPreco,
): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return "—";
  // Compara em centavos pra não depender de ponto flutuante (12.00, não 11.999…).
  const redondo = semCentavosZerados && Math.round(n * 100) % 100 === 0;
  if (simbolo) return (redondo ? BRL_INTEIRO : BRL).format(n);
  return (redondo ? VALOR_INTEIRO : VALOR).format(n);
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

// Sem `timeZone` explícito, o Intl.DateTimeFormat usa o fuso do PROCESSO —
// fixado em src/instrumentation.ts (produção na Vercel roda em UTC por
// padrão, o que atrasaria esses horários em 3h). Ver também
// src/lib/periodo.ts e src/lib/gerencial.ts.
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
