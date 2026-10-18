"use client";

import { useEffect, useMemo } from "react";

import { chamadoEstaOcupado } from "@/lib/chamado-ocupado";
import { createClient } from "@/lib/supabase/client";

/**
 * Escuta em tempo real a publicação do cardápio (ver
 * src/app/painel/publicar-actions.ts) e recarrega a página sozinha quando o
 * Administrador publica — não precisa o cliente atualizar na mão.
 *
 * Espera terminar qualquer "Chamar garçom" em andamento antes de recarregar
 * (ver chamado-ocupado.ts): sem isso, um recarregamento bem na hora que o
 * cliente aperta o botão cancelaria essa chamada no meio do caminho.
 */
export function AtualizadorPublicacao() {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    function recarregarQuandoLivre() {
      // eslint-disable-next-line no-console
      console.log("[atualizador] evento recebido");
      if (!chamadoEstaOcupado()) {
        window.location.reload();
        return;
      }
      const iv = setInterval(() => {
        if (!chamadoEstaOcupado()) {
          clearInterval(iv);
          window.location.reload();
        }
      }, 1000);
    }

    const canal = supabase
      .channel("cardapio-publicado")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cardapio_publicado" },
        recarregarQuandoLivre,
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        console.log("[atualizador] status da inscrição:", status);
      });

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [supabase]);

  return null;
}
