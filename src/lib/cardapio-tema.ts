/**
 * Mapeamento de arredondamento (enum do banco) para px. Compartilhado entre a
 * prévia do admin (`/painel/cardapio/aparencia`) e o cardápio público, pra não
 * ter duas fontes de verdade sobre "quanto é cada nível".
 */
export const RAIO_PX = {
  nenhum: 0,
  pequeno: 8,
  medio: 16,
  grande: 24,
} as const;

export type Arredondamento = keyof typeof RAIO_PX;

export const ARREDONDAMENTO_LABEL: Record<Arredondamento, string> = {
  nenhum: "Nenhum",
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Valida um valor de cor hex (#rrggbb) vindo de um &lt;input type="color"&gt;. */
export function corValida(valor: string): boolean {
  return HEX_RE.test(valor);
}
