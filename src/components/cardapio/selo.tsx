import type { CSSProperties } from "react";

export type CorSelo = "laranja" | "preto";

// Borda ondulada de "carimbo": 14 ondas em volta do círculo.
const ONDAS = 14;
const PONTOS = 168;
const CONTORNO = (() => {
  let d = "";
  for (let i = 0; i <= PONTOS; i++) {
    const a = (i / PONTOS) * Math.PI * 2;
    const r = 47 + 2.6 * Math.cos(ONDAS * a);
    d += `${i === 0 ? "M" : "L"}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
})();

/** Estrela de 5 pontas centrada em (cx, cy). */
function estrela(cx: number, cy: number, raio: number): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? raio : raio * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Divide o texto em até 3 linhas equilibradas (a mais longa o mais curta possível):
 * "INDICAÇÃO DA CASA" → ["INDICAÇÃO", "DA CASA"]; "MAIS VENDIDO" → ["MAIS", "VENDIDO"].
 */
export function linhasDoSelo(texto: string): string[] {
  const palavras = texto.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return palavras;

  const juntar = (de: number, ate: number) => palavras.slice(de, ate).join(" ");
  const maior = (linhas: string[]) => Math.max(...linhas.map((l) => l.length));

  let melhor = [palavras.join(" ")];
  let melhorMaior = Infinity;
  // 2 linhas: um ponto de corte.
  for (let i = 1; i < palavras.length; i++) {
    const linhas = [juntar(0, i), juntar(i, palavras.length)];
    if (maior(linhas) < melhorMaior) [melhor, melhorMaior] = [linhas, maior(linhas)];
  }
  // 3 linhas só vale a pena com 4+ palavras e texto longo.
  if (palavras.length >= 4 && texto.length > 16) {
    for (let i = 1; i < palavras.length - 1; i++) {
      for (let j = i + 1; j < palavras.length; j++) {
        const linhas = [juntar(0, i), juntar(i, j), juntar(j, palavras.length)];
        if (maior(linhas) < melhorMaior) [melhor, melhorMaior] = [linhas, maior(linhas)];
      }
    }
  }
  return melhor;
}

/**
 * Selo redondo de destaque do produto ("Indicação da casa", "Mais vendido"…).
 * Sem hooks (serve em componente de servidor e de cliente). Laranja acompanha a cor de destaque do
 * cardápio (`--cardapio-destaque`); preto é fixo. O tamanho vem de `className` (ex.: "size-12").
 */
export function Selo({
  texto,
  cor,
  estrelas = false,
  className,
  style,
}: {
  texto: string;
  cor: CorSelo;
  /** 3 estrelas acima e 3 abaixo do texto — só compensa em tamanhos grandes. */
  estrelas?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const linhas = linhasDoSelo(texto);
  const maior = Math.max(1, ...linhas.map((l) => l.length));
  // ~84 unidades de largura útil dentro dos anéis; 0,84 evita encostar na borda.
  const fonte = Math.max(6.5, Math.min(17, 84 / maior));
  const alturaLinha = fonte * 1.12;
  const primeiraLinha = 50 - ((linhas.length - 1) * alturaLinha) / 2;

  const fundo = cor === "preto" ? "#111111" : "var(--cardapio-destaque, #f07e22)";
  const traco = cor === "preto" ? "var(--cardapio-destaque, #f07e22)" : "#ffffff";

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Selo: ${texto}`}
      className={className}
      style={style}
    >
      <path d={CONTORNO} style={{ fill: fundo }} />
      <circle cx="50" cy="50" r="40.5" fill="none" style={{ stroke: traco }} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="37.5" fill="none" style={{ stroke: traco }} strokeWidth="0.7" />
      {estrelas ? (
        <g style={{ fill: traco }}>
          <path d={estrela(50, 23, 3.4)} />
          <path d={estrela(37, 26.5, 2.6)} />
          <path d={estrela(63, 26.5, 2.6)} />
          <path d={estrela(50, 77, 3.4)} />
          <path d={estrela(37, 73.5, 2.6)} />
          <path d={estrela(63, 73.5, 2.6)} />
        </g>
      ) : null}
      {linhas.map((linha, i) => (
        <text
          key={i}
          x="50"
          y={primeiraLinha + i * alturaLinha}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fonte}
          fontWeight={800}
          fontFamily="inherit"
          style={{ fill: "#ffffff" }}
        >
          {linha}
        </text>
      ))}
    </svg>
  );
}
