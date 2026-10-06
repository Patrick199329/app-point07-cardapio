"use client";

import { useEffect, useRef, useState } from "react";


const INTERVALO_MS = 3500;

/**
 * Bloco "Destaques" no topo do cardápio público: cards na horizontal que passam
 * sozinhos. Pausa quando o cliente encosta/arrasta, e volta ao início no fim.
 */
export type ItemDestaque = {
  id: string;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  precoTexto: string;
};

export function DestaquesCarrossel({
  itens,
  corDestaque,
}: {
  itens: ItemDestaque[];
  corDestaque: string;
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || itens.length < 2) return;
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
  }, [pausado, itens.length]);

  if (itens.length === 0) return null;

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
        {itens.map((p) => {
          return (
            <article
              key={p.id}
              className="w-[78%] shrink-0 snap-start overflow-hidden rounded-[var(--cardapio-raio)] bg-[var(--cardapio-bloco)] shadow-md sm:w-72"
            >
              {p.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagemUrl} alt={p.nome} className="h-36 w-full object-cover" />
              ) : null}
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 font-semibold">{p.nome}</p>
                {p.descricao ? (
                  <p className="line-clamp-2 text-sm text-[#5a5a5a]">{p.descricao}</p>
                ) : null}
                <p className="pt-1 font-medium tabular-nums" style={{ color: corDestaque }}>
                  {p.precoTexto}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
