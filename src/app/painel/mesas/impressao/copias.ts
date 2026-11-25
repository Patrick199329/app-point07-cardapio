/**
 * Quantas vezes cada cartão sai na impressão. Cartões de mesa saem 1x; o QR
 * universal tem `copiasNoA4`: na folha A4 repete (4 por folha, uma folha
 * inteira do mesmo cartão, pra recortar); no totem (1 cartão por página) sai 1x.
 */
export function expandirCopias<T extends { id: string; copiasNoA4?: number }>(
  cartoes: T[],
  formato: "totem" | "a4",
): { chave: string; cartao: T }[] {
  return cartoes.flatMap((cartao) => {
    const copias = formato === "a4" ? Math.max(1, cartao.copiasNoA4 ?? 1) : 1;
    return Array.from({ length: copias }, (_, i) => ({
      chave: `${cartao.id}-${i}`,
      cartao,
    }));
  });
}
