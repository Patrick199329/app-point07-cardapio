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
  sombra,
}: {
  itens: ItemDestaque[];
  corDestaque: string;
  sombra: boolean;
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
        const passo = (trilha.firstElementChild as HTMLElement | null)?.offsetWidth ?? trilha.clientWidth;
        trilha.scrollBy({ left: passo + 12, behavior: "smooth" });
      }
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, itens.length]);

  if (itens.length === 0) return null;

  return (
    <section className="space-y-3 pt-5" aria-label="Destaques">
      <h2 className="px-4 text-base font-semibold">Destaques</h2>
      <div
        ref={trilhaRef}
        onPointerDown={() => setPausado(true)}
        onPointerUp={() => setPausado(false)}
        onPointerLeave={() => setPausado(false)}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[10%] pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {itens.map((p) => {
          return (
            <article
              key={p.id}
              className={`w-[80%] shrink-0 snap-center overflow-hidden rounded-2xl bg-[var(--cardapio-bloco)] ${sombra ? "shadow-sm" : ""} ring-1 ring-black/5`}
            >
              {p.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagemUrl} alt={p.nome} className="h-40 w-full object-cover" />
              ) : null}
              <div className="space-y-1.5 p-4">
                <p className="line-clamp-2 font-semibold leading-snug">{p.nome}</p>
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
