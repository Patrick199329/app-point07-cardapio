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
