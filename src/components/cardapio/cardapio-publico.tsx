import type { CSSProperties } from "react";

import { ChamarGarcomButton } from "@/app/cardapio/chamar-garcom-button";
import { ImagemProduto } from "@/components/cardapio/imagem-produto";
import type {
  CardapioPublicoData,
  GrupoOpcoesPublico,
  ProdutoPublico,
} from "@/lib/cardapio";
import { RAIO_PX } from "@/lib/cardapio-tema";
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
  const preco = "text-[var(--cardapio-destaque)]";
  if (produto.modelo === "tamanhos") {
    return (
      <div className="shrink-0 text-right text-sm tabular-nums">
        <div>
          <span className="text-muted-foreground">M </span>
          <span className={preco}>{formatarPreco(produto.preco_medio)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">G </span>
          <span className={preco}>{formatarPreco(produto.preco_grande)}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`shrink-0 text-right text-sm font-medium tabular-nums ${preco}`}>
      {formatarPreco(produto.preco)}
    </div>
  );
}

function ProdutoCard({
  produto,
  sombra,
}: {
  produto: ProdutoPublico;
  sombra: boolean;
}) {
  const img = urlImagemProduto(produto.imagem_path);
  const serveAte =
    produto.modelo === "compartilhar" && produto.serve_ate ? (
      <p className="mt-0.5 text-xs text-muted-foreground">
        Serve até {produto.serve_ate} pessoas
      </p>
    ) : null;

  const conteudo =
    img && produto.imagem_layout === "grande" ? (
      <div className="flex flex-col items-center text-center">
        <ImagemProduto
          src={img}
          alt={produto.nome}
          className="mx-auto aspect-square w-full max-w-56 sm:max-w-64"
        />
        <p className="mt-3 font-medium">{produto.nome}</p>
        {produto.descricao ? (
          <p className="text-sm text-muted-foreground">{produto.descricao}</p>
        ) : null}
        {serveAte}
        <div className="mt-1">
          <Precos produto={produto} />
        </div>
      </div>
    ) : (
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

export function CardapioPublico({
  categorias,
  avisos,
  config,
  mesaToken,
  mesaIdentificador,
}: CardapioPublicoData & {
  mesaToken: string | null;
  mesaIdentificador?: string;
}) {
  const raio = RAIO_PX[config.arredondamento];
  const vars = {
    "--cardapio-fundo": config.cor_fundo,
    "--cardapio-cabecalho": config.cor_fundo_cabecalho,
    "--cardapio-bloco": config.cor_bloco,
    "--cardapio-destaque": config.cor_destaque,
    "--cardapio-raio": `${raio}px`,
  } as CSSProperties;

  const logoUrl = urlImagemProduto(config.logo_path);
  const logoSrc = logoUrl
    ? `${logoUrl}?v=${encodeURIComponent(config.updated_at)}`
    : null;
  const mostrarNome = !logoSrc || config.mostrar_nome_com_logo;

  return (
    <div
      className="mx-auto min-h-svh w-full max-w-2xl bg-[var(--cardapio-fundo)] pb-28"
      style={vars}
    >
      <header className="sticky top-0 z-30 border-b bg-[var(--cardapio-cabecalho)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={config.nome_estabelecimento}
                className="h-9 w-auto object-contain"
              />
            ) : null}
            {mostrarNome ? (
              <h1 className="text-lg font-semibold">
                {config.nome_estabelecimento}
              </h1>
            ) : null}
          </div>
          {mesaIdentificador ? (
            <span className="shrink-0 text-sm text-muted-foreground">
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
        <div className="space-y-6 px-4 py-5">
          {categorias.map((categoria) => (
            <section
              key={categoria.id}
              id={`cat-${categoria.id}`}
              className="scroll-mt-28"
            >
              <h2
                className={
                  config.categorias_centralizadas
                    ? "mb-3 text-center text-xl font-bold"
                    : "mb-3 text-base font-semibold"
                }
              >
                {categoria.nome}
              </h2>
              <ul className="space-y-3">
                {categoria.produtos.map((produto) => (
                  <li key={produto.id}>
                    <ProdutoCard produto={produto} sombra={config.sombra} />
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

      <ChamarGarcomButton mesaToken={mesaToken} corDestaque={config.cor_destaque} />
    </div>
  );
}
