import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReorderButtons } from "@/app/painel/cardapio/reorder-buttons";
import { createClient } from "@/lib/supabase/server";

import { adicionarOpcao, excluirGrupo, removerOpcao } from "./actions";
import { GrupoDialog } from "./grupo-dialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ produtoId: string }>;
}) {
  const { produtoId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos")
    .select("nome")
    .eq("id", produtoId)
    .single();
  return { title: `Opções — ${data?.nome ?? "Produto"} — Point07` };
}

export default async function OpcoesProdutoPage({
  params,
}: {
  params: Promise<{ produtoId: string }>;
}) {
  const { produtoId } = await params;
  const supabase = await createClient();

  const { data: produto } = await supabase
    .from("produtos")
    .select("id, nome, categoria_id")
    .eq("id", produtoId)
    .single();
  if (!produto) notFound();

  const { data: grupos } = await supabase
    .from("produto_grupos_opcoes")
    .select("id, titulo, observacao, ordem, produto_opcoes(id, nome, ordem)")
    .eq("produto_id", produtoId)
    .order("ordem", { ascending: true })
    .order("ordem", { ascending: true, referencedTable: "produto_opcoes" });

  const lista = grupos ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/painel/cardapio/${produto.categoria_id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Categoria
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{produto.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Grupos de opções — informativo, sem seleção nem cálculo no
              cardápio público.
            </p>
          </div>
          <GrupoDialog produtoId={produtoId} trigger={<Button>Novo grupo</Button>} />
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum grupo ainda. Ex.: “Todas Acompanham”, “Escolha 1 Carne”.
        </p>
      ) : (
        <ul className="space-y-4">
          {lista.map((grupo, i) => (
            <li key={grupo.id} className="rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <ReorderButtons
                  tabela="produto_grupos_opcoes"
                  id={grupo.id}
                  produtoId={produtoId}
                  primeiro={i === 0}
                  ultimo={i === lista.length - 1}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{grupo.titulo}</p>
                  {grupo.observacao ? (
                    <p className="text-sm text-muted-foreground">
                      {grupo.observacao}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <GrupoDialog
                    produtoId={produtoId}
                    grupo={grupo}
                    trigger={
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    }
                  />
                  <form action={excluirGrupo}>
                    <input type="hidden" name="id" value={grupo.id} />
                    <input type="hidden" name="produto_id" value={produtoId} />
                    <Button variant="ghost" size="sm" type="submit">
                      Excluir
                    </Button>
                  </form>
                </div>
              </div>

              {(grupo.produto_opcoes?.length ?? 0) > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {grupo.produto_opcoes!.map((opcao) => (
                    <span
                      key={opcao.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pr-1.5 pl-3 text-sm"
                    >
                      {opcao.nome}
                      <form action={removerOpcao}>
                        <input type="hidden" name="id" value={opcao.id} />
                        <input
                          type="hidden"
                          name="produto_id"
                          value={produtoId}
                        />
                        <button
                          type="submit"
                          aria-label={`Remover ${opcao.nome}`}
                          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
                        >
                          ×
                        </button>
                      </form>
                    </span>
                  ))}
                </div>
              ) : null}

              <form
                action={adicionarOpcao}
                className="mt-3 flex items-center gap-2"
              >
                <input type="hidden" name="grupo_id" value={grupo.id} />
                <input type="hidden" name="produto_id" value={produtoId} />
                <div className="max-w-56 flex-1">
                  <Input name="nome" placeholder="Nova opção" required />
                </div>
                <Button type="submit" variant="outline" size="sm">
                  + opção
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
