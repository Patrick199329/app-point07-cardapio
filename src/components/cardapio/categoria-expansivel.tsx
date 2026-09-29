"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const EVENTO_ABRIR_CATEGORIA = "cardapio:abrir-categoria";

export function CategoriaExpansivel({
  id,
  nome,
  abertaInicialmente = false,
  centralizada,
  children,
}: {
  id: string;
  nome: string;
  abertaInicialmente?: boolean;
  centralizada: boolean;
  children: ReactNode;
}) {
  const [aberta, setAberta] = useState(abertaInicialmente);
  const conteudoId = `cat-conteudo-${id}`;

  useEffect(() => {
    function abrir(event: Event) {
      const customEvent = event as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id === id) setAberta(true);
    }

    document.addEventListener(EVENTO_ABRIR_CATEGORIA, abrir);
    return () => document.removeEventListener(EVENTO_ABRIR_CATEGORIA, abrir);
  }, [id]);

  return (
    <section id={`cat-${id}`} className="scroll-mt-28">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={conteudoId}
        onClick={() => setAberta((valor) => !valor)}
        className={`group flex min-h-12 w-full items-center gap-3 rounded-[var(--cardapio-raio)] bg-[var(--cardapio-bloco)] px-4 py-3 text-left shadow-sm transition-[box-shadow,transform] duration-200 active:scale-[0.99] ${
          centralizada ? "justify-center" : "justify-between"
        }`}
      >
        <span
          className={
            centralizada
              ? "text-center text-xl font-bold"
              : "text-base font-semibold"
          }
        >
          {nome}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 text-[var(--cardapio-destaque)] transition-transform duration-300 ${
            aberta ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        id={conteudoId}
        aria-hidden={!aberta}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          aberta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

