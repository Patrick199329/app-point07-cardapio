"use client";

import { type ReactNode, useMemo, useState } from "react";

import Link from "next/link";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { definirStatusProduto, excluirProduto } from "./actions";
import { ExcluirButton } from "./excluir-button";
import {
  ProdutoDialog,
  type ProdutoForm,
  type SeloOpcao,
} from "./[categoriaId]/produto-dialog";
import {
  type Filtro,
  filtrarProdutos,
  termosDaConsulta,
} from "./busca-logica";
import { MODELO_LABEL } from "./produto-resumo";

export type ProdutoBusca = {
  form: ProdutoForm;
  categoriaId: string;
  categoriaNome: string;
  categoriaAtiva: boolean;
  ativo: boolean;
  /** Texto do selo aplicado (só pra mostrar na linha), se houver. */
  seloTexto: string | null;
  resumoPreco: string;
  opcoes: number;
};

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "ativos", label: "Ativos" },
  { valor: "inativos", label: "Inativos" },
  { valor: "destaques", label: "Destaques" },
  { valor: "sem-foto", label: "Sem foto" },
];

/**
 * Busca de produtos por todo o cardápio (independe de categoria). Sem busca e
 * sem filtro, mostra `children` (a lista de categorias); com busca/filtro,
 * troca a lista de categorias pelos produtos encontrados.
 */
export function BuscaCardapio({
  produtos,
  selos,
  children,
}: {
  produtos: ProdutoBusca[];
  selos: SeloOpcao[];
  children: ReactNode;
}) {
  const [consulta, setConsulta] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const termos = useMemo(() => termosDaConsulta(consulta), [consulta]);
  const buscando = termos.length > 0 || filtro !== "todos";

  const resultados = useMemo(
    () => (buscando ? filtrarProdutos(produtos, termos, filtro) : []),
    [buscando, filtro, produtos, termos],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscar produto por nome, descrição ou categoria…"
            aria-label="Buscar produto"
            className="h-10 pr-9 pl-9 md:h-9"
          />
          {consulta ? (
            <button
              type="button"
              onClick={() => setConsulta("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
          {FILTROS.map((f) => (
            <Button
              key={f.valor}
              type="button"
              size="sm"
              variant={filtro === f.valor ? "default" : "outline"}
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {!buscando ? (
        children
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {resultados.length === 0
              ? "Nenhum produto encontrado."
              : `${resultados.length} produto(s) encontrado(s)`}
          </p>

          <ul className="space-y-3">
            {resultados.map((p) => (
              <li key={p.form.id} className="flex gap-3 rounded-lg border p-3 sm:p-4">
                {p.form.imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.form.imagemUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-md border object-cover"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.form.nome}</span>
                    <Badge variant="outline">{MODELO_LABEL[p.form.modelo]}</Badge>
                    {p.form.destaque ? <Badge>Destaque</Badge> : null}
                    {p.seloTexto ? <Badge>Selo: {p.seloTexto}</Badge> : null}
                    {!p.ativo ? <Badge variant="secondary">Inativo</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    em{" "}
                    <Link
                      href={`/painel/cardapio/${p.categoriaId}`}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {p.categoriaNome}
                    </Link>
                    {!p.categoriaAtiva ? " (categoria inativa)" : ""}
                  </p>
                  {p.form.descricao ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {p.form.descricao}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm tabular-nums">{p.resumoPreco}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <ProdutoDialog
                      categoriaId={p.categoriaId}
                      produto={p.form}
                      selos={selos}
                      trigger={
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <Link
                      href={`/painel/cardapio/produtos/${p.form.id}/opcoes`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Opções{p.opcoes > 0 ? ` (${p.opcoes})` : ""}
                    </Link>
                    <form action={definirStatusProduto}>
                      <input type="hidden" name="id" value={p.form.id} />
                      <input
                        type="hidden"
                        name="ativo"
                        value={p.ativo ? "false" : "true"}
                      />
                      <Button variant="ghost" size="sm" type="submit">
                        {p.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <ExcluirButton
                      id={p.form.id}
                      acao={excluirProduto}
                      titulo={`Excluir "${p.form.nome}"?`}
                      descricao="O produto, a foto e as opções dele serão removidos de vez, inclusive do cardápio público depois de publicar. Não dá para desfazer. Se for só tirar do cardápio por um tempo, use Desativar."
                      sucesso="Produto excluído."
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
