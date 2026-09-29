"use client";

import { useEffect, useRef, useState } from "react";

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

// Depois desse tempo com a aba escondida/sem uso, na volta perguntamos se o
// cliente ainda está na mesma mesa antes de liberar o "Chamar garçom" de
// novo. Curto o bastante pra pegar quem foi embora e outro grupo sentou;
// longo o bastante pra não incomodar quem só trocou de aba rapidinho.
const LIMITE_INATIVIDADE_MS = 15 * 60 * 1000;

/**
 * QR code é fixo (impresso na mesa) — nada impede o cliente de deixar o app
 * aberto, sair, e outra pessoa/grupo ocupar a mesma mesa depois. Sem isso, o
 * "Chamar garçom" chamaria pra mesa errada. Só monta quando há mesaToken
 * (não faz sentido perguntar "ainda está na mesa X" sem mesa nenhuma).
 */
export function ConfirmarMesa({ mesaIdentificador }: { mesaIdentificador: string }) {
  const [perguntar, setPerguntar] = useState(false);
  const [lendoQr, setLendoQr] = useState(false);
  const escondidoDesdeRef = useRef<number | null>(null);

  useEffect(() => {
    function aoMudarVisibilidade() {
      if (document.visibilityState === "hidden") {
        escondidoDesdeRef.current = Date.now();
        return;
      }
      const desde = escondidoDesdeRef.current;
      escondidoDesdeRef.current = null;
      if (desde && Date.now() - desde >= LIMITE_INATIVIDADE_MS) {
        setPerguntar(true);
      }
    }
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }, []);

  function aoConfirmarQueContinua() {
    setPerguntar(false);
  }

  function aoConfirmarQueTrocou() {
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
          <Button variant="outline" onClick={aoConfirmarQueTrocou}>
            Troquei de mesa
          </Button>
          <Button onClick={aoConfirmarQueContinua}>Sim, continuo aqui</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
