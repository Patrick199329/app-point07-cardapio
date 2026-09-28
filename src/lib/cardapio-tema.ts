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

/** Altura da logo no cabeçalho, em px. */
export const LOGO_ALTURA_PX = {
  pequeno: 28,
  medio: 40,
  grande: 56,
} as const;

export type LogoTamanho = keyof typeof LOGO_ALTURA_PX;

export const LOGO_TAMANHO_LABEL: Record<LogoTamanho, string> = {
  pequeno: "Pequena",
  medio: "Média",
  grande: "Grande",
};

export type LogoPosicao = "esquerda" | "centro" | "direita";

export const LOGO_POSICAO_LABEL: Record<LogoPosicao, string> = {
  esquerda: "Esquerda",
  centro: "Centro",
  direita: "Direita",
};

export type DescricaoCaixa = "original" | "maiusculo" | "frase";

export const DESCRICAO_CAIXA_LABEL: Record<DescricaoCaixa, string> = {
  original: "Como foi cadastrado",
  maiusculo: "TUDO MAIÚSCULO",
  frase: "Só a primeira letra maiúscula",
};

/**
 * Normaliza a caixa da descrição pro cardápio público — os dados migrados do
 * WordPress vêm com uma mistura de "tudo maiúsculo" e texto normal, sem
 * padrão nenhum entre os itens. Em vez de reeditar cada um na mão, o
 * Administrador escolhe um padrão de exibição só (a descrição salva no banco
 * não muda, isso é só como ela aparece).
 */
export function formatarDescricao(texto: string, modo: DescricaoCaixa): string {
  if (modo === "maiusculo") return texto.toUpperCase();
  if (modo === "frase") {
    const minusculo = texto.toLowerCase();
    return minusculo.charAt(0).toUpperCase() + minusculo.slice(1);
  }
  return texto;
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Valida um valor de cor hex (#rrggbb) vindo de um &lt;input type="color"&gt;. */
export function corValida(valor: string): boolean {
  return HEX_RE.test(valor);
}
