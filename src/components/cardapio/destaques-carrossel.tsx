"use client";

import { useEffect, useRef, useState } from "react";

import type { ProdutoPublico } from "@/lib/cardapio";
import { formatarPreco } from "@/lib/formato";
import { urlImagemProduto } from "@/lib/imagem";

const INTERVALO_MS = 3500;

function precoDestaque(p: ProdutoPublico) {
  if (p.modelo === "tamanhos") return formatarPreco(p.preco_medio);
  return formatarPreco(p.preco);
}

/**
 * Bloco "Destaques" no topo do cardápio público: cards na horizontal que passam
 * sozinhos. Pausa quando o cliente encosta/arrasta, e volta ao início no fim.
 */
export function DestaquesCarrossel({
  produtos,
  corDestaque,
}: {
  produtos: ProdutoPublico[];
  corDestaque: string;
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || produtos.length < 2) return;
    const trilha = trilhaRef.current;
    if (!trilha) return;

    const id = setInterval(() => {
      const fimDaTrilha =
        trilha.scrollLeft + trilha.clientWidth >= trilha.scrollWidth - 4;
      if (fimDaTrilha) {
        trilha.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        trilha.scrollBy({ left: trilha.clientWidth * 0.8, behavior: "smooth" });
      }
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, produtos.length]);

  if (produtos.length === 0) return null;

  return (
    <section className="space-y-3 px-4 pt-5" aria-label="Destaques">
      <h2 className="text-base font-semibold">Destaques</h2>
      <div
        ref={trilhaRef}
        onPointerDown={() => setPausado(true)}
        onPointerUp={() => setPausado(false)}
        onPointerLeave={() => setPausado(false)}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {produtos.map((p) => {
          const img = urlImagemProduto(p.imagem_path);
          return (
            <article
              key={p.id}
              className="w-[78%] shrink-0 snap-start overflow-hidden rounded-[var(--cardapio-raio)] bg-[var(--cardapio-bloco)] shadow-md sm:w-72"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={p.nome} className="h-36 w-full object-cover" />
              ) : null}
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 font-semibold">{p.nome}</p>
                {p.descricao ? (
                  <p className="line-clamp-2 text-sm text-[#5a5a5a]">{p.descricao}</p>
                ) : null}
                <p className="pt-1 font-medium tabular-nums" style={{ color: corDestaque }}>
                  {precoDestaque(p)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
