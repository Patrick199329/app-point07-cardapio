"use client";

import { useTransition } from "react";

import { LogOut } from "lucide-react";

import { desinscreverPushAtual } from "@/app/fila/push-cliente";
import { signOut } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";

/**
 * Sair da conta. Antes de encerrar a sessão, cancela a inscrição de push
 * (bônus) desse aparelho — sem isso, um garçom deslogado continuaria
 * recebendo notificação de chamado nesse navegador (a inscrição em
 * `push_inscricoes` é independente da sessão logada). No-op silencioso pra
 * quem nunca ativou push (ex.: Administrador).
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  function sair() {
    startTransition(async () => {
      await desinscreverPushAtual();
      await signOut();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={sair} disabled={pending}>
      <LogOut className="size-4" />
      Sair
    </Button>
  );
}
