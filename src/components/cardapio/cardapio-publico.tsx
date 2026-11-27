import type { CSSProperties } from "react";

import { ChamarGarcomButton } from "@/app/cardapio/chamar-garcom-button";
import { AtualizadorPublicacao } from "@/components/cardapio/atualizador-publicacao";
import { CategoriaExpansivel } from "@/components/cardapio/categoria-expansivel";
import { CategoriaNav } from "@/components/cardapio/categoria-nav";
import { ConfirmarMesa } from "@/components/cardapio/confirmar-mesa";
import { DestaquesCarrossel } from "@/components/cardapio/destaques-carrossel";
import { type OpcoesPreco, ProdutoCard } from "@/components/cardapio/produto-card";
import { RevelarAoRolar } from "@/components/cardapio/revelar-ao-rolar";
import { VoltarAoTopo } from "@/components/cardapio/voltar-ao-topo";
import type { CardapioPublicoData } from "@/lib/cardapio";
import {
  formatarDescricao,
  LOGO_ALTURA_PX,
  RAIO_PX,
} from "@/lib/cardapio-tema";
import { formatarPrecoPublico } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";

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
                            imagemUrl={urlImagemProduto(produto.imagem_path)}
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
                            imagemUrl={urlImagemProduto(produto.imagem_path)}
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
