import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { urlImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

import { definirStatusCategoria, excluirCategoria } from "./actions";
import { BuscaCardapio, type ProdutoBusca } from "./busca-cardapio";
import { CategoriaDialog } from "./categoria-dialog";
import { ExcluirButton } from "./excluir-button";
import { ListaOrdenavel } from "./lista-ordenavel";
import { precoResumo } from "./produto-resumo";
import { ReorderButtons } from "./reorder-buttons";

export const metadata = { title: "Cardápio" };

export default async function CardapioPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, ativo, ordem, updated_at, produtos(ativo)")
    .order("ordem", { ascending: true });

  const lista = categorias ?? [];

  // Todos os produtos, para a busca por todo o cardápio (um único restaurante:
  // dezenas/poucas centenas de linhas, filtradas no navegador).
  const { data: todosProdutos } = await supabase
    .from("produtos")
    .select(
      "id, categoria_id, nome, descricao, modelo, preco, preco_medio, preco_grande, preco_medio_label, preco_grande_label, serve_ate, imagem_path, imagem_layout, destaque, selo_id, ativo, ordem, produto_grupos_opcoes(count)",
    )
    .order("ordem", { ascending: true });

  const { data: selosRaw } = await supabase
    .from("selos")
    .select("id, texto, ativo")
    .order("created_at", { ascending: true });
  const selos = selosRaw ?? [];
  const seloPorId = new Map(selos.map((s) => [s.id, s.texto]));

  const categoriaPorId = new Map(lista.map((c, i) => [c.id, { ...c, posicao: i }]));
  const produtosBusca: ProdutoBusca[] = (todosProdutos ?? [])
    .flatMap((p) => {
      const categoria = categoriaPorId.get(p.categoria_id);
      if (!categoria) return [];
      return [
        {
          posicao: categoria.posicao,
          item: {
            form: {
              id: p.id,
              nome: p.nome,
              descricao: p.descricao,
              modelo: p.modelo,
              preco: p.preco,
              preco_medio: p.preco_medio,
              preco_grande: p.preco_grande,
              preco_medio_label: p.preco_medio_label,
              preco_grande_label: p.preco_grande_label,
              serve_ate: p.serve_ate,
              imagemUrl: urlImagemProduto(p.imagem_path),
              imagemLayout: p.imagem_layout,
              destaque: p.destaque,
              seloId: p.selo_id,
            },
            categoriaId: categoria.id,
            categoriaNome: categoria.nome,
            categoriaAtiva: categoria.ativo,
            ativo: p.ativo,
            seloTexto: p.selo_id ? (seloPorId.get(p.selo_id) ?? null) : null,
            resumoPreco: precoResumo(p),
            opcoes: p.produto_grupos_opcoes?.[0]?.count ?? 0,
          } satisfies ProdutoBusca,
        },
      ];
    })
    // ordem do cardápio: categoria, depois a ordem do produto (já vem ordenado)
    .sort((a, b) => a.posicao - b.posicao)
    .map((x) => x.item);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Cardápio</h1>
          <p className="text-sm text-muted-foreground">
            Categorias, produtos e avisos. A ordem aqui é a ordem no cardápio
            público.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/painel/cardapio/avisos"
            className={buttonVariants({ variant: "outline" })}
          >
            Avisos
          </Link>
          <CategoriaDialog trigger={<Button>Nova categoria</Button>} />
        </div>
      </div>

      <BuscaCardapio produtos={produtosBusca} selos={selos}>
        {lista.length === 0 ? (
          <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
            Nenhuma categoria ainda. Crie a primeira para começar o cardápio.
          </p>
        ) : (
          <ListaOrdenavel
            key={lista
              .map(
                (c) =>
                  `${c.id}:${c.updated_at}:${(c.produtos ?? []).filter((p) => p.ativo).length}:${(c.produtos ?? []).length}`,
              )
              .join("|")}
            tabela="categorias"
            classeLista="space-y-3"
            classeLinha="flex items-center gap-2 rounded-lg border p-3 sm:p-4"
            itens={lista.map((categoria, i) => {
              const produtos = categoria.produtos ?? [];
              const ativos = produtos.filter((p) => p.ativo).length;
              return {
                id: categoria.id,
                conteudo: (
                  <>
                    <ReorderButtons
                      tabela="categorias"
                      id={categoria.id}
                      primeiro={i === 0}
                      ultimo={i === lista.length - 1}
                    />

                    {/* Título e botões em bloco que QUEBRA LINHA: em tela estreita os
                        botões descem pra baixo do título em vez de espremê-lo. */}
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        href={`/painel/cardapio/${categoria.id}`}
                        className="min-w-[9rem] flex-1"
                      >
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{categoria.nome}</span>
                          {!categoria.ativo ? (
                            <Badge variant="secondary">Inativa</Badge>
                          ) : null}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {produtos.length === 0
                            ? "sem produtos"
                            : `${ativos} de ${produtos.length} ativo(s)`}
                        </span>
                      </Link>

                      <div className="flex shrink-0 items-center gap-1">
                        <CategoriaDialog
                          categoria={categoria}
                          trigger={
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          }
                        />
                        <form action={definirStatusCategoria}>
                          <input type="hidden" name="id" value={categoria.id} />
                          <input
                            type="hidden"
                            name="ativo"
                            value={categoria.ativo ? "false" : "true"}
                          />
                          <Button variant="ghost" size="sm" type="submit">
                            {categoria.ativo ? "Desativar" : "Ativar"}
                          </Button>
                        </form>
                        <ExcluirButton
                          id={categoria.id}
                          acao={excluirCategoria}
                          titulo={`Excluir a categoria "${categoria.nome}"?`}
                          descricao="A categoria será removida de vez, inclusive do cardápio público depois de publicar. Não dá para desfazer."
                          sucesso="Categoria excluída."
                          bloqueio={
                            produtos.length > 0
                              ? `"${categoria.nome}" ainda tem ${produtos.length} produto(s). Mova os produtos para outra categoria ou exclua-os antes. Se for só tirar do cardápio por um tempo, use Desativar.`
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </>
                ),
              };
            })}
          />
        )}
      </BuscaCardapio>
    </div>
  );
}
