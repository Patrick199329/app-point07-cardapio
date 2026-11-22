export type Filtro = "todos" | "ativos" | "inativos" | "destaques" | "sem-foto";

export type ItemBuscavel = {
  ativo: boolean;
  categoriaNome: string;
  form: {
    nome: string;
    descricao: string | null;
    destaque: boolean;
    imagemUrl: string | null;
  };
};

/** minúsculas e sem acento: "cafe" encontra "Café". */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function termosDaConsulta(consulta: string) {
  return normalizar(consulta).split(/\s+/).filter(Boolean);
}

function passaFiltro(p: ItemBuscavel, filtro: Filtro) {
  switch (filtro) {
    case "ativos":
      return p.ativo;
    case "inativos":
      return !p.ativo;
    case "destaques":
      return p.form.destaque;
    case "sem-foto":
      return !p.form.imagemUrl;
    default:
      return true;
  }
}

/**
 * Todos os termos precisam aparecer (nome, descrição ou categoria). Quem casa
 * no NOME vem antes de quem só casa na descrição/categoria; dentro de cada
 * grupo mantém a ordem recebida (a do cardápio).
 */
export function filtrarProdutos<T extends ItemBuscavel>(
  produtos: T[],
  termos: string[],
  filtro: Filtro,
): T[] {
  const achados = produtos
    .filter((p) => passaFiltro(p, filtro))
    .map((p) => {
      const nome = normalizar(p.form.nome);
      const resto = normalizar(`${p.form.descricao ?? ""} ${p.categoriaNome}`);
      const todosNoNome = termos.every((t) => nome.includes(t));
      const todosNoTexto = termos.every(
        (t) => nome.includes(t) || resto.includes(t),
      );
      return { p, nivel: todosNoNome ? 0 : todosNoTexto ? 1 : 2 };
    })
    .filter((x) => x.nivel < 2);
  // Array.prototype.sort é estável: a ordem do cardápio se mantém no empate.
  return achados.sort((a, b) => a.nivel - b.nivel).map((x) => x.p);
}
