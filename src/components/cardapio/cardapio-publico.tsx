import type { CSSProperties } from "react";

import { ChamarGarcomButton } from "@/app/cardapio/chamar-garcom-button";
import { CategoriaExpansivel } from "@/components/cardapio/categoria-expansivel";
import { CategoriaNav } from "@/components/cardapio/categoria-nav";
import { ConfirmarMesa } from "@/components/cardapio/confirmar-mesa";
import { DestaquesCarrossel } from "@/components/cardapio/destaques-carrossel";
import { ImagemProduto } from "@/components/cardapio/imagem-produto";
import { RevelarAoRolar } from "@/components/cardapio/revelar-ao-rolar";
import { VoltarAoTopo } from "@/components/cardapio/voltar-ao-topo";
import type {
  CardapioPublicoData,
  GrupoOpcoesPublico,
  ProdutoPublico,
} from "@/lib/cardapio";
import {
  type DescricaoCaixa,
  formatarDescricao,
  LOGO_ALTURA_PX,
  RAIO_PX,
} from "@/lib/cardapio-tema";
import { formatarPreco } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";

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

function Precos({ produto }: { produto: ProdutoPublico }) {
  const preco = "font-medium text-[var(--cardapio-destaque)]";
  if (produto.modelo === "tamanhos") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
        <span>
          <span className="text-[#5a5a5a]">{produto.preco_medio_label} </span>
          <span className={preco}>{formatarPreco(produto.preco_medio)}</span>
        </span>
        <span>
          <span className="text-[#5a5a5a]">{produto.preco_grande_label} </span>
          <span className={preco}>{formatarPreco(produto.preco_grande)}</span>
        </span>
      </div>
    );
  }
  return (
    <div className={`text-sm tabular-nums ${preco}`}>
      {formatarPreco(produto.preco)}
    </div>
  );
}

function ProdutoCard({
  produto,
  sombra,
  descricaoCaixa,
}: {
  produto: ProdutoPublico;
  sombra: boolean;
  descricaoCaixa: DescricaoCaixa;
}) {
  const img = urlImagemProduto(produto.imagem_path);
  const descricao = produto.descricao
    ? formatarDescricao(produto.descricao, descricaoCaixa)
    : null;
  const serveAte =
    produto.modelo === "compartilhar" && produto.serve_ate ? (
      <p className="mt-0.5 text-xs text-[#5a5a5a]">
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
        {descricao ? (
          <p className="text-sm text-[#5a5a5a]">{descricao}</p>
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
        <div className="min-w-0 flex-1">
          <p className="font-medium">{produto.nome}</p>
          {descricao ? (
            <p className="text-sm text-[#5a5a5a]">{descricao}</p>
          ) : null}
          {serveAte}
          <div className="mt-1.5">
            <Precos produto={produto} />
          </div>
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
  destaques,
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
    "--cardapio-texto-cabecalho": config.cor_texto_cabecalho,
    "--cardapio-categoria-nav-fundo": config.cor_categoria_nav_fundo,
    "--cardapio-categoria-nav-fundo-ativa": config.cor_categoria_nav_fundo_ativa,
  } as CSSProperties;

  const logoUrl = urlImagemProduto(config.logo_path);
  const logoSrc = logoUrl
    ? `${logoUrl}?v=${encodeURIComponent(config.updated_at)}`
    : null;
  const mostrarNome = !logoSrc || config.mostrar_nome_com_logo;
  const logoAltura = LOGO_ALTURA_PX[config.logo_tamanho];
  const alinhamentoLogo =
    config.logo_posicao === "centro"
      ? "justify-center"
      : config.logo_posicao === "direita"
        ? "justify-end"
        : "justify-start";

  return (
    <div
      className="mx-auto min-h-svh w-full max-w-2xl bg-[var(--cardapio-fundo)] pb-32"
      style={vars}
    >
      <header className="sticky top-0 z-30 border-b bg-[var(--cardapio-cabecalho)] text-[var(--cardapio-texto-cabecalho)]">
        <div className={`relative flex items-center px-4 py-3 ${alinhamentoLogo}`}>
          <div className="flex items-center gap-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={config.nome_estabelecimento}
                style={{ height: logoAltura }}
                className="w-auto object-contain"
              />
            ) : null}
            {mostrarNome ? (
              <h1 className="text-lg font-semibold">
                {config.nome_estabelecimento}
              </h1>
            ) : null}
          </div>
          {mesaIdentificador && mesaToken ? (
            // Sem opacity: cor_texto_cabecalho já é a escolha do Administrador
            // pra ter contraste com cor_fundo_cabecalho — baixar a opacidade
            // aqui diluía esse contraste de novo, ficando ilegível quando as
            // duas cores do cabeçalho eram tons próximos.
            <ConfirmarMesa
              mesaIdentificador={mesaIdentificador}
              confirmarAposMinutos={config.mesa_confirmar_apos_minutos}
              className="absolute top-1/2 right-4 shrink-0 -translate-y-1/2 text-sm font-medium"
            />
          ) : null}
        </div>
        {categorias.length > 1 ? (
          <CategoriaNav
            categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
          />
        ) : null}
      </header>

      <DestaquesCarrossel produtos={destaques} corDestaque={config.cor_destaque} />

      <main>
        {categorias.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-[#5a5a5a]">
            O cardápio está sendo atualizado. Volte em instantes.
          </p>
        ) : (
          <div className="space-y-6 px-4 py-5">
            {categorias.map((categoria) =>
              config.agrupar_categorias ? (
                <CategoriaExpansivel
                  key={categoria.id}
                  id={categoria.id}
                  nome={categoria.nome}
                  abertaInicialmente={categoria.id === categorias[0]?.id}
                  centralizada={config.categorias_centralizadas}
                >
                  <ul className="space-y-3">
                    {categoria.produtos.map((produto, indice) => (
                      <li key={produto.id}>
                        <RevelarAoRolar atraso={(indice % 4) * 55}>
                          <ProdutoCard
                            produto={produto}
                            sombra={config.sombra}
                            descricaoCaixa={config.descricao_caixa}
                          />
                        </RevelarAoRolar>
                      </li>
                    ))}
                  </ul>
                </CategoriaExpansivel>
              ) : (
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
                    {categoria.produtos.map((produto, indice) => (
                      <li key={produto.id}>
                        <RevelarAoRolar atraso={(indice % 4) * 55}>
                          <ProdutoCard
                            produto={produto}
                            sombra={config.sombra}
                            descricaoCaixa={config.descricao_caixa}
                          />
                        </RevelarAoRolar>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            )}
          </div>
        )}

        {avisos.some((a) => !a.fixo) ? (
          <div className="mt-2 space-y-1 border-t px-4 py-5 text-sm text-[#5a5a5a]">
            {avisos.filter((a) => !a.fixo).map((a) => (
              <p key={a.id}>{a.texto}</p>
            ))}
          </div>
        ) : null}
      </main>

      <VoltarAoTopo />

      <ChamarGarcomButton
        mesaToken={mesaToken}
        mesaIdentificador={mesaIdentificador}
        corDestaque={config.cor_destaque}
        avisos={avisos.filter((a) => a.fixo)}
      />
    </div>
  );
}
