import type { Metadata } from "next";

import { formatarPreco } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

import { ChamarGarcomButton } from "./chamar-garcom-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio — Point07",
  description: "Cardápio do Point07",
};

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  modelo: "simples" | "tamanhos" | "compartilhar";
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  serve_ate: number | null;
  imagem_path: string | null;
};

function Precos({ produto }: { produto: Produto }) {
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

export default async function CardapioPublicoPage() {
  const supabase = await createClient();

  const [{ data: categoriasRaw }, { data: avisos }] = await Promise.all([
    supabase
      .from("categorias")
      .select(
        "id, nome, produtos(id, nome, descricao, modelo, preco, preco_medio, preco_grande, serve_ate, imagem_path)",
      )
      .order("ordem", { ascending: true })
      .order("ordem", { ascending: true, referencedTable: "produtos" }),
    supabase.from("avisos").select("id, texto").order("ordem", { ascending: true }),
  ]);

  const categorias = (categoriasRaw ?? []).filter(
    (c) => (c.produtos ?? []).length > 0,
  );

  return (
    <div className="mx-auto min-h-svh w-full max-w-2xl pb-28">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">Point07</h1>
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
                {(categoria.produtos ?? []).map((produto) => {
                  const img = urlImagemProduto(produto.imagem_path);
                  return (
                    <li key={produto.id} className="flex gap-3">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          className="size-16 shrink-0 rounded-lg border object-cover"
                        />
                      ) : null}
                      <div className="flex min-w-0 flex-1 justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{produto.nome}</p>
                          {produto.descricao ? (
                            <p className="text-sm text-muted-foreground">
                              {produto.descricao}
                            </p>
                          ) : null}
                          {produto.modelo === "compartilhar" &&
                          produto.serve_ate ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Serve até {produto.serve_ate} pessoas
                            </p>
                          ) : null}
                        </div>
                        <Precos produto={produto} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {avisos && avisos.length > 0 ? (
        <div className="mt-2 space-y-1 border-t bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
          {avisos.map((aviso) => (
            <p key={aviso.id}>{aviso.texto}</p>
          ))}
        </div>
      ) : null}

      <ChamarGarcomButton />
    </div>
  );
}
