import type { CSSProperties } from "react";

import { ChamarGarcomButton } from "@/app/cardapio/chamar-garcom-button";
import { AtualizadorPublicacao } from "@/components/cardapio/atualizador-publicacao";
import { CategoriaExpansivel } from "@/components/cardapio/categoria-expansivel";
import { CategoriaNav } from "@/components/cardapio/categoria-nav";
import { ConfirmarMesa } from "@/components/cardapio/confirmar-mesa";
import { DestaquesCarrossel } from "@/components/cardapio/destaques-carrossel";
import { ImagemProduto } from "@/components/cardapio/imagem-produto";
import { Selo } from "@/components/cardapio/selo";
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
import { formatarPrecoPublico } from "@/lib/formato";
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

/** Opções de como o preço aparece (Configurações → Aparência). */
type OpcoesPreco = {
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

function ProdutoCard({
  produto,
  sombra,
  descricaoCaixa,
  tamanhoImagem,
  opcoes,
}: {
  produto: ProdutoPublico;
  sombra: boolean;
  descricaoCaixa: DescricaoCaixa;
  tamanhoImagem: "pequeno" | "medio" | "grande";
  opcoes: OpcoesPreco;
}) {
  const img = urlImagemProduto(produto.imagem_path);
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

export function CardapioPublico({
  categorias,
  destaques,
  avisos,
  config,
  mesaToken,
  mesaIdentificador,
  chamadaAtiva = true,
}: CardapioPublicoData & {
  mesaToken: string | null;
  mesaIdentificador?: string;
  /** `fila_config.chamada_garcom_ativa`: desligada, some o botão e o selo da mesa. */
  chamadaAtiva?: boolean;
}) {
  const opcoesPreco: OpcoesPreco = {
    simbolo: config.mostrar_simbolo_moeda,
    // `!!`: cardápio publicado antes dessas opções existirem não tem os campos.
    semCentavosZerados: !!config.preco_ocultar_centavos_zerados,
    corDescricao: !!config.preco_cor_da_descricao,
    junto: !!config.preco_junto_da_descricao,
  };
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
          {chamadaAtiva && mesaIdentificador && mesaToken ? (
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

      <DestaquesCarrossel
        corDestaque={config.cor_destaque}
        precoCorDescricao={opcoesPreco.corDescricao}
        sombra={config.sombra}
        itens={destaques.map((p) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao
            ? formatarDescricao(p.descricao, config.descricao_caixa)
            : null,
          imagemUrl: urlImagemProduto(p.imagem_path),
          selo: p.selo ?? null,
          precoTexto: formatarPrecoPublico(
            p.modelo === "tamanhos" ? p.preco_medio : p.preco,
            opcoesPreco,
          ),
        }))}
      />

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
                            tamanhoImagem={config.tamanho_imagem_produto}
                            opcoes={opcoesPreco}
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
                            tamanhoImagem={config.tamanho_imagem_produto}
                            opcoes={opcoesPreco}
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

      <AtualizadorPublicacao />

      <VoltarAoTopo />

      <ChamarGarcomButton
        mesaToken={mesaToken}
        mesaIdentificador={mesaIdentificador}
        corDestaque={config.cor_destaque}
        avisos={avisos.filter((a) => a.fixo)}
        chamadaAtiva={chamadaAtiva}
      />
    </div>
  );
}
