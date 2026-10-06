import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

import { definirStatusProduto, moverProdutoParaCategoria } from "../actions";
import { ListaOrdenavel } from "../lista-ordenavel";
import { ReorderButtons } from "../reorder-buttons";
import { ProdutoDialog, type ProdutoForm } from "./produto-dialog";

const MODELO_LABEL = {
  simples: "Simples",
  tamanhos: "Tamanhos",
  compartilhar: "Compartilhar",
} as const;

function precoResumo(p: {
  modelo: "simples" | "tamanhos" | "compartilhar";
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  preco_medio_label: string | null;
  preco_grande_label: string | null;
  serve_ate: number | null;
}) {
  if (p.modelo === "tamanhos") {
    return `${p.preco_medio_label} ${formatarPreco(p.preco_medio)} · ${p.preco_grande_label} ${formatarPreco(p.preco_grande)}`;
  }
  if (p.modelo === "compartilhar") {
    return p.serve_ate
      ? `${formatarPreco(p.preco)} · serve até ${p.serve_ate}`
      : formatarPreco(p.preco);
  }
  return formatarPreco(p.preco);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}) {
  const { categoriaId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("nome")
    .eq("id", categoriaId)
    .single();
  return { title: `${data?.nome ?? "Categoria"} — Cardápio — Point07` };
}

export default async function CategoriaProdutosPage({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}) {
  const { categoriaId } = await params;
  const supabase = await createClient();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nome, ativo")
    .eq("id", categoriaId)
    .single();
  if (!categoria) notFound();

  const { data: produtos } = await supabase
    .from("produtos")
    .select(
      "id, nome, descricao, modelo, preco, preco_medio, preco_grande, preco_medio_label, preco_grande_label, serve_ate, imagem_path, imagem_layout, destaque, ativo, ordem, produto_grupos_opcoes(count)",
    )
    .eq("categoria_id", categoriaId)
    .order("ordem", { ascending: true });

  const { data: outrasCategorias } = await supabase
    .from("categorias")
    .select("id, nome")
    .neq("id", categoriaId)
    .order("ordem", { ascending: true });

  const lista = produtos ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/cardapio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Cardápio
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{categoria.nome}</h1>
            {!categoria.ativo ? <Badge variant="secondary">Inativa</Badge> : null}
          </div>
          <ProdutoDialog
            categoriaId={categoriaId}
            trigger={<Button>Novo produto</Button>}
          />
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum produto nesta categoria ainda.
        </p>
      ) : (
        <ListaOrdenavel
          key={lista.map((p) => p.id).join("|")}
          tabela="produtos"
          categoriaId={categoriaId}
          classeLista="space-y-3"
          classeLinha="flex gap-2 rounded-lg border p-3 sm:p-4"
          itens={lista.map((produto, i) => {
            const form: ProdutoForm = {
              id: produto.id,
              nome: produto.nome,
              descricao: produto.descricao,
              modelo: produto.modelo,
              preco: produto.preco,
              preco_medio: produto.preco_medio,
              preco_grande: produto.preco_grande,
              preco_medio_label: produto.preco_medio_label,
              preco_grande_label: produto.preco_grande_label,
              serve_ate: produto.serve_ate,
              imagemUrl: urlImagemProduto(produto.imagem_path),
              imagemLayout: produto.imagem_layout,
              destaque: produto.destaque,
            };
            return {
              id: produto.id,
              conteudo: (
                <>
                  <ReorderButtons
                    tabela="produtos"
                    id={produto.id}
                    categoriaId={categoriaId}
                    primeiro={i === 0}
                    ultimo={i === lista.length - 1}
                  />

                  {form.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imagemUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-md border object-cover"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{produto.nome}</span>
                      <Badge variant="outline">
                        {MODELO_LABEL[produto.modelo]}
                      </Badge>
                      {!produto.ativo ? (
                        <Badge variant="secondary">Inativo</Badge>
                      ) : null}
                    </div>
                    {produto.descricao ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {produto.descricao}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm tabular-nums">
                      {precoResumo(produto)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <ProdutoDialog
                        categoriaId={categoriaId}
                        produto={form}
                        trigger={
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        }
                      />
                      <Link
                        href={`/painel/cardapio/produtos/${produto.id}/opcoes`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Opções
                        {(produto.produto_grupos_opcoes?.[0]?.count ?? 0) > 0
                          ? ` (${produto.produto_grupos_opcoes![0].count})`
                          : ""}
                      </Link>
                      <form action={definirStatusProduto}>
                        <input type="hidden" name="id" value={produto.id} />
                        <input
                          type="hidden"
                          name="ativo"
                          value={produto.ativo ? "false" : "true"}
                        />
                        <Button variant="ghost" size="sm" type="submit">
                          {produto.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                    </div>

                    {(outrasCategorias ?? []).length > 0 ? (
                      <form
                        action={moverProdutoParaCategoria}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="produto_id" value={produto.id} />
                        <select
                          name="categoria_destino_id"
                          required
                          defaultValue=""
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="" disabled>
                            Mover para outra categoria…
                          </option>
                          {(outrasCategorias ?? []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                        <Button variant="outline" size="sm" type="submit">
                          Mover
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
