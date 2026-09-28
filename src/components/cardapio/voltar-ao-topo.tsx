"use client";

import { useEffect, useState } from "react";

import { ArrowUp } from "lucide-react";

/**
 * Botão flutuante "voltar ao topo" — só aparece depois que o cliente rola
 * um pouco a página (cardápios costumam ser longos, várias categorias).
 * Fica acima da barra fixa de "Chamar garçom"/avisos, no canto oposto pra
 * não brigar com ela.
 */
export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setVisivel(window.scrollY > 400);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (!visivel) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo do cardápio"
      className="fixed right-4 bottom-32 z-40 flex size-10 items-center justify-center rounded-full border bg-background/95 text-foreground shadow-lg backdrop-blur transition-opacity"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
