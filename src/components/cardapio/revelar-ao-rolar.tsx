"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function RevelarAoRolar({
  atraso = 0,
  children,
}: {
  atraso?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const reduzirMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduzirMovimento || !("IntersectionObserver" in window)) return;

    const dentroDeCategoriaFechada =
      elemento.closest('[aria-hidden="true"]') !== null;
    const jaVisivel =
      elemento.getBoundingClientRect().top <= window.innerHeight * 0.96;
    if (jaVisivel && !dentroDeCategoriaFechada) return;

    elemento.classList.add("cardapio-reveal-pendente");
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        elemento.classList.remove("cardapio-reveal-pendente");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="cardapio-reveal"
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {children}
    </div>
  );
}
