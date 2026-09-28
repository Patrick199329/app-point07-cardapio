"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";

/**
 * Navegação de categorias do cabeçalho do cardápio público. Rolagem suave ao
 * tocar (sem o "pulo" seco do link de âncora padrão), feedback de toque leve
 * no chip e destaque automático da categoria visível enquanto o cliente rola
 * a página — tudo com CSS/observers nativos, sem dependência nova.
 */
export function CategoriaNav({
  categorias,
}: {
  categorias: { id: string; nome: string }[];
}) {
  const [ativa, setAtiva] = useState<string | null>(categorias[0]?.id ?? null);
  const navRef = useRef<HTMLElement>(null);

  // Marca como ativa a categoria mais próxima do topo entre as visíveis.
  useEffect(() => {
    const secoes = categorias
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (secoes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiveis = entries.filter((e) => e.isIntersecting);
        if (visiveis.length === 0) return;
        const maisProxima = visiveis.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setAtiva(maisProxima.target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );
    secoes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categorias]);

  // Acompanha o chip ativo dentro da faixa de navegação (scroll horizontal).
  useEffect(() => {
    if (!ativa || !navRef.current) return;
    navRef.current
      .querySelector<HTMLElement>(`[data-cat="${ativa}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [ativa]);

  function irParaCategoria(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      ref={navRef}
      className="flex gap-2 overflow-x-auto scroll-smooth px-4 pb-3"
    >
      {categorias.map((c) => {
        const destacada = ativa === c.id;
        return (
          <a
            key={c.id}
            data-cat={c.id}
            href={`#cat-${c.id}`}
            onClick={(e) => irParaCategoria(e, c.id)}
            aria-current={destacada ? "true" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-all duration-200 ease-out active:scale-95 ${
              destacada
                ? "border-[var(--cardapio-destaque)] bg-[var(--cardapio-categoria-nav-fundo-ativa)] font-medium text-[var(--cardapio-destaque)] opacity-100"
                : "border-current bg-[var(--cardapio-categoria-nav-fundo)] opacity-70"
            }`}
          >
            {c.nome}
          </a>
        );
      })}
    </nav>
  );
}
