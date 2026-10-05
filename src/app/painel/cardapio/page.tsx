import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { definirStatusCategoria } from "./actions";
import { CategoriaDialog } from "./categoria-dialog";
import { ListaOrdenavel } from "./lista-ordenavel";
import { ReorderButtons } from "./reorder-buttons";

export const metadata = { title: "Cardápio — Point07" };

export default async function CardapioPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, ativo, ordem, produtos(ativo)")
    .order("ordem", { ascending: true });

  const lista = categorias ?? [];

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

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhuma categoria ainda. Crie a primeira para começar o cardápio.
        </p>
      ) : (
        <ListaOrdenavel
          key={lista.map((c) => c.id).join("|")}
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

                  <Link
                    href={`/painel/cardapio/${categoria.id}`}
                    className="min-w-0 flex-1"
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
