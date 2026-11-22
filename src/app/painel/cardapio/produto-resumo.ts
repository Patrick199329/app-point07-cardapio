import { formatarPreco } from "@/lib/formato";

export const MODELO_LABEL = {
  simples: "Simples",
  tamanhos: "Tamanhos",
  compartilhar: "Compartilhar",
} as const;

export function precoResumo(p: {
  modelo: "simples" | "tamanhos" | "compartilhar";
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  preco_medio_label: string | null;
  preco_grande_label: string | null;
  serve_ate: number | null;
}) {
  if (p.modelo === "tamanhos") {
    return `${p.preco_medio_label} ${formatarPreco(p.preco_medio)} · ${p.preco_grande_label} ${formatarPreco(p.preco_grande)}`;
  }
  if (p.modelo === "compartilhar") {
    return p.serve_ate
      ? `${formatarPreco(p.preco)} · serve até ${p.serve_ate}`
      : formatarPreco(p.preco);
  }
  return formatarPreco(p.preco);
}
