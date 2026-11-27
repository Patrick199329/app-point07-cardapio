import { ImagemProduto } from "@/components/cardapio/imagem-produto";
import { Selo } from "@/components/cardapio/selo";
import type { GrupoOpcoesPublico, ProdutoPublico } from "@/lib/cardapio";
import { type DescricaoCaixa, formatarDescricao } from "@/lib/cardapio-tema";
import { formatarPrecoPublico } from "@/lib/formato";

// `text-[#5a5a5a]` em vez de `text-muted-foreground` (cinza padrão do tema,
// shadcn) em todo texto secundário desta página: o cinza padrão só passa
// ~3,9-4,5:1 de contraste contra os fundos configuráveis do cardápio
// (cor_fundo/cor_bloco), abaixo dos 4,5:1 exigidos pelo WCAG AA — achado
// rodando Lighthouse contra produção (28/09). Como essas cores de fundo são
// escolhidas livremente pelo Administrador, um cinza fixo mais escuro é mais
// seguro do que o token do tema (pensado pra fundo branco puro).

/**
 * Grupos de opções são só informativos — o cliente lê pra saber o que pedir
 * verbalmente com o garçom, sem seleção nem total calculado (o cardápio é
 * somente para consulta).
 */
function GruposOpcoes({ grupos }: { grupos: GrupoOpcoesPublico[] }) {
  if (grupos.length === 0) return null;
  return (
    <div className="mt-2 space-y-2 border-t pt-2">
      {grupos.map((grupo) => (
        <div key={grupo.id}>
          <p className="text-xs font-semibold text-[var(--cardapio-destaque)]">
            {grupo.titulo}
          </p>
          {grupo.opcoes.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {grupo.opcoes.map((opcao) => (
                <span
                  key={opcao.id}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                >
                  {opcao.nome}
                </span>
              ))}
            </div>
          ) : null}
          {grupo.observacao ? (
            <p className="mt-1 text-xs text-[#5a5a5a]">
              {grupo.observacao}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Opções de como o preço aparece (Configurações → Aparência). */
export type OpcoesPreco = {
  simbolo: boolean;
  semCentavosZerados: boolean;
  /** Preço com a cor e o peso do texto da descrição (sem o destaque). */
  corDescricao: boolean;
  /** Preço no fim da descrição, depois de um traço. */
  junto: boolean;
};

/** Itens do preço: 1 (simples/compartilhar) ou 2 com rótulo (tamanhos). */
function itensPreco(
  produto: ProdutoPublico,
  opcoes: OpcoesPreco,
): { rotulo?: string; valor: string }[] {
  if (produto.modelo === "tamanhos") {
    return [
      { rotulo: produto.preco_medio_label ?? "", valor: formatarPrecoPublico(produto.preco_medio, opcoes) },
      { rotulo: produto.preco_grande_label ?? "", valor: formatarPrecoPublico(produto.preco_grande, opcoes) },
    ];
  }
  return [{ valor: formatarPrecoPublico(produto.preco, opcoes) }];
}

/** Preço numa linha própria (comportamento padrão). */
function Precos({ produto, opcoes }: { produto: ProdutoPublico; opcoes: OpcoesPreco }) {
  const preco = opcoes.corDescricao
    ? "text-[#5a5a5a]"
    : "font-medium text-[var(--cardapio-destaque)]";
  const itens = itensPreco(produto, opcoes);
  if (produto.modelo === "tamanhos") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
        {itens.map((item, i) => (
          <span key={i}>
            <span className="text-[#5a5a5a]">{item.rotulo} </span>
            <span className={preco}>{item.valor}</span>
          </span>
        ))}
      </div>
    );
  }
  return <div className={`text-sm tabular-nums ${preco}`}>{itens[0].valor}</div>;
}

/**
 * Preço no fim da descrição, no mesmo parágrafo: "Descrição — 12,50" (ou
 * "Descrição — Médio 18 · Grande 28"). Cada pedaço fica com `nowrap` pra o traço
 * e o valor nunca se separarem numa quebra de linha.
 */
function PrecoJunto({
  produto,
  opcoes,
  comTraco,
}: {
  produto: ProdutoPublico;
  opcoes: OpcoesPreco;
  comTraco: boolean;
}) {
  // Com `corDescricao` herda a cor/peso do parágrafo; senão mantém o destaque.
  const estilo = opcoes.corDescricao ? "" : "font-medium text-[var(--cardapio-destaque)]";
  return (
    <>
      {itensPreco(produto, opcoes).map((item, i) => (
        <span key={i} className={`whitespace-nowrap tabular-nums ${estilo}`}>
          {" "}
          {i === 0 ? (comTraco ? "— " : "") : "· "}
          {item.rotulo ? `${item.rotulo} ` : ""}
          {item.valor}
        </span>
      ))}
    </>
  );
}

export function ProdutoCard({
  produto,
  imagemUrl,
  sombra,
  descricaoCaixa,
  tamanhoImagem,
  opcoes,
}: {
  produto: ProdutoPublico;
  /** URL pública da foto (calculada por quem chama: aqui não dá pra importar o helper server-only). */
  imagemUrl: string | null;
  sombra: boolean;
  descricaoCaixa: DescricaoCaixa;
  tamanhoImagem: "pequeno" | "medio" | "grande";
  opcoes: OpcoesPreco;
}) {
  const img = imagemUrl;
  const descricao = produto.descricao
    ? formatarDescricao(produto.descricao, descricaoCaixa)
    : null;
  // Descrição; com "preço junto" o valor entra no fim do mesmo parágrafo (e, sem
  // descrição, vira o próprio parágrafo, sem traço).
  const linhaDescricao =
    descricao || opcoes.junto ? (
      <p className="text-sm text-[#5a5a5a]">
        {descricao}
        {opcoes.junto ? (
          <PrecoJunto produto={produto} opcoes={opcoes} comTraco={Boolean(descricao)} />
        ) : null}
      </p>
    ) : null;
  const serveAte =
    produto.modelo === "compartilhar" && produto.serve_ate ? (
      <p className="mt-0.5 text-xs text-[#5a5a5a]">
        Serve até {produto.serve_ate} pessoas
      </p>
    ) : null;

  const conteudo =
    img && produto.imagem_layout === "grande" ? (
      <div className="flex flex-col items-center text-center">
        <div className="relative mx-auto w-full max-w-56 sm:max-w-64">
          <ImagemProduto src={img} alt={produto.nome} className="aspect-square w-full" />
          {produto.selo ? (
            <Selo
              texto={produto.selo.texto}
              cor={produto.selo.cor}
              estrelas
              className="absolute -top-2 -right-2 size-14 rotate-6 drop-shadow-md"
            />
          ) : null}
        </div>
        <p className="mt-3 font-medium">{produto.nome}</p>
        {linhaDescricao}
        {serveAte}
        {opcoes.junto ? null : (
          <div className="mt-1">
            <Precos produto={produto} opcoes={opcoes} />
          </div>
        )}
      </div>
    ) : (
      <div className={`flex gap-3 ${tamanhoImagem === "grande" ? "min-h-36" : ""}`}>
        {img && tamanhoImagem !== "grande" ? (
          <ImagemProduto
            src={img}
            alt={produto.nome}
            className={tamanhoImagem === "medio" ? "size-24" : "size-16"}
          />
        ) : null}
        {/* flow-root: contém o selo flutuante, e o texto contorna ele sem perder largura à toa. */}
        <div className="min-w-0 flex-1 flow-root">
          {produto.selo ? (
            <Selo
              texto={produto.selo.texto}
              cor={produto.selo.cor}
              className="float-right mb-1 ml-2 size-12 -rotate-6 drop-shadow-sm"
            />
          ) : null}
          <p className="font-medium">{produto.nome}</p>
          {linhaDescricao}
          {serveAte}
          {opcoes.junto ? null : (
            <div className="mt-1.5">
              <Precos produto={produto} opcoes={opcoes} />
            </div>
          )}
        </div>
        {img && tamanhoImagem === "grande" ? (
          <ImagemProduto src={img} alt={produto.nome} className="h-36 w-[42%] shrink-0" />
        ) : null}
      </div>
    );

  return (
    <div
      className={`bg-[var(--cardapio-bloco)] p-3 rounded-[var(--cardapio-raio)] sm:p-4 ${sombra ? "shadow-md" : ""}`}
    >
      {conteudo}
      <GruposOpcoes grupos={produto.grupos} />
    </div>
  );
}
