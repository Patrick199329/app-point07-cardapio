import { ChamarGarcomButton } from "@/app/cardapio/chamar-garcom-button";
import { ImagemProduto } from "@/components/cardapio/imagem-produto";
import type {
  CardapioPublicoData,
  GrupoOpcoesPublico,
  ProdutoPublico,
} from "@/lib/cardapio";
import { formatarPreco } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";

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
          <p className="text-xs font-semibold text-primary">{grupo.titulo}</p>
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
            <p className="mt-1 text-xs text-muted-foreground">
              {grupo.observacao}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Precos({ produto }: { produto: ProdutoPublico }) {
  if (produto.modelo === "tamanhos") {
    return (
      <div className="shrink-0 text-right text-sm tabular-nums">
        <div>
          <span className="text-muted-foreground">M </span>
          {formatarPreco(produto.preco_medio)}
        </div>
        <div>
          <span className="text-muted-foreground">G </span>
          {formatarPreco(produto.preco_grande)}
        </div>
      </div>
    );
  }
  return (
    <div className="shrink-0 text-right text-sm font-medium tabular-nums">
      {formatarPreco(produto.preco)}
    </div>
  );
}

function ProdutoCard({ produto }: { produto: ProdutoPublico }) {
  const img = urlImagemProduto(produto.imagem_path);
  const serveAte =
    produto.modelo === "compartilhar" && produto.serve_ate ? (
      <p className="mt-0.5 text-xs text-muted-foreground">
        Serve até {produto.serve_ate} pessoas
      </p>
    ) : null;

  if (img && produto.imagem_layout === "grande") {
    return (
      <>
        <div className="flex flex-col items-center text-center">
          <ImagemProduto
            src={img}
            alt={produto.nome}
            className="mx-auto aspect-square w-full max-w-56 sm:max-w-64"
          />
          <p className="mt-3 font-medium">{produto.nome}</p>
          {produto.descricao ? (
            <p className="text-sm text-muted-foreground">
              {produto.descricao}
            </p>
          ) : null}
          {serveAte}
          <div className="mt-1">
            <Precos produto={produto} />
          </div>
        </div>
        <GruposOpcoes grupos={produto.grupos} />
      </>
    );
  }

  return (
    <>
      <div className="flex gap-3">
        {img ? (
          <ImagemProduto src={img} alt={produto.nome} className="size-16" />
        ) : null}
        <div className="flex min-w-0 flex-1 justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{produto.nome}</p>
            {produto.descricao ? (
              <p className="text-sm text-muted-foreground">
                {produto.descricao}
              </p>
            ) : null}
            {serveAte}
          </div>
          <Precos produto={produto} />
        </div>
      </div>
      <GruposOpcoes grupos={produto.grupos} />
    </>
  );
}

export function CardapioPublico({
  categorias,
  avisos,
  mesaToken,
  mesaIdentificador,
}: CardapioPublicoData & {
  mesaToken: string | null;
  mesaIdentificador?: string;
}) {
  return (
    <div className="mx-auto min-h-svh w-full max-w-2xl pb-28">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex items-baseline justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-semibold">Point07</h1>
          {mesaIdentificador ? (
            <span className="text-sm text-muted-foreground">
              {mesaIdentificador}
            </span>
          ) : null}
        </div>
        {categorias.length > 1 ? (
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
            {categorias.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="shrink-0 rounded-full border px-3 py-1 text-sm text-muted-foreground"
              >
                {c.nome}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      {categorias.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">
          O cardápio está sendo atualizado. Volte em instantes.
        </p>
      ) : (
        <div className="divide-y">
          {categorias.map((categoria) => (
            <section
              key={categoria.id}
              id={`cat-${categoria.id}`}
              className="scroll-mt-28 px-4 py-5"
            >
              <h2 className="mb-3 text-base font-semibold">{categoria.nome}</h2>
              <ul className="space-y-4">
                {categoria.produtos.map((produto) => (
                  <li key={produto.id}>
                    <ProdutoCard produto={produto} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {avisos.length > 0 ? (
        <div className="mt-2 space-y-1 border-t bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
          {avisos.map((aviso) => (
            <p key={aviso.id}>{aviso.texto}</p>
          ))}
        </div>
      ) : null}

      <ChamarGarcomButton mesaToken={mesaToken} />
    </div>
  );
}
