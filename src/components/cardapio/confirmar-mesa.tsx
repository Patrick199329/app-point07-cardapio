"use client";

import { useEffect, useRef, useState } from "react";

import { RefreshCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeitorQr } from "@/components/cardapio/leitor-qr";
import { cn } from "@/lib/utils";

/**
 * QR code é fixo (impresso na mesa) — nada impede o cliente de deixar o app
 * aberto, sair, e outra pessoa/grupo ocupar a mesma mesa depois. Sem isso, o
 * "Chamar garçom" chamaria pra mesa errada.
 *
 * Dois jeitos de disparar a releitura, os dois caem no mesmo leitor de QR:
 * 1) Automático — depois de um tempo parado, pergunta "ainda está na mesa X?"
 * 2) Manual — a própria pessoa clica no selo da mesa (no cabeçalho) porque já
 *    sabe que vai trocar, sem precisar esperar o timer nem confirmar nada
 *    (clicar já é a intenção clara).
 *
 * Substitui o <span> antigo do identificador da mesa no cabeçalho — por isso
 * sempre recebe e sempre mostra o texto, mesmo sem token nenhum pra ler de
 * novo ainda não teria sentido, mas só monta quando há mesaToken (ver
 * cardapio-publico.tsx).
 */
export function ConfirmarMesa({
  mesaIdentificador,
  confirmarAposMinutos,
  className,
}: {
  mesaIdentificador: string;
  /** `cardapio_config.mesa_confirmar_apos_minutos` — configurável pelo Administrador. */
  confirmarAposMinutos: number;
  className?: string;
}) {
  const [perguntar, setPerguntar] = useState(false);
  const [lendoQr, setLendoQr] = useState(false);
  const escondidoDesdeRef = useRef<number | null>(null);

  useEffect(() => {
    const limiteMs = confirmarAposMinutos * 60 * 1000;
    function aoMudarVisibilidade() {
      if (document.visibilityState === "hidden") {
        escondidoDesdeRef.current = Date.now();
        return;
      }
      const desde = escondidoDesdeRef.current;
      escondidoDesdeRef.current = null;
      if (desde && Date.now() - desde >= limiteMs) {
        setPerguntar(true);
      }
    }
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, [confirmarAposMinutos]);

  function abrirLeitor() {
    setPerguntar(false);
    setLendoQr(true);
  }

  function aoDetectarQr(conteudo: string) {
    try {
      // Confia no caminho (/mesa/<token>), não exige que o domínio bata: um
      // QR impresso antes de uma troca de domínio ainda tem que funcionar.
      const url = new URL(conteudo, window.location.origin);
      if (/^\/mesa\/[^/]+$/.test(url.pathname)) {
        window.location.href = url.pathname;
        return;
      }
    } catch {
      // conteúdo não é uma URL válida — ignora e deixa o leitor continuar
    }
  }

  if (lendoQr) {
    return <LeitorQr onDetectado={aoDetectarQr} onFechar={() => setLendoQr(false)} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={abrirLeitor}
        className={cn("cursor-pointer bg-transparent p-0 text-inherit", className)}
        title="Trocar de mesa"
      >
        <span className="inline-flex items-center gap-1">
          {mesaIdentificador}
          <RefreshCw className="size-3 opacity-70" />
        </span>
      </button>

      <Dialog open={perguntar} onOpenChange={setPerguntar}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Você ainda está na {mesaIdentificador}?</DialogTitle>
            <DialogDescription>
              Notamos que você ficou um tempo sem usar o app. Se trocou de mesa, escaneie o QR
              code da mesa atual pra continuar chamando o garçom certinho.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={abrirLeitor}>
              Troquei de mesa
            </Button>
            <Button onClick={() => setPerguntar(false)}>Sim, continuo aqui</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
