"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { alternarQrUniversal } from "../actions";

export function QrUniversalToggle({ ativo }: { ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      const res = await alternarQrUniversal(!ativo);
      if (res.ok) {
        toast.success(ativo ? "QR universal desativado." : "QR universal ativado.");
      } else {
        toast.error(res.error ?? "Não foi possível alterar.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3 print:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          QR universal:{" "}
          <span className={ativo ? "text-green-700" : "text-destructive"}>
            {ativo ? "ativo" : "desativado"}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Um QR só para o cardápio: o cliente escolhe em qual mesa está (útil
          quando mesas são juntadas). Os QRs de cada mesa seguem funcionando
          normalmente. Desativar não muda o QR impresso — ao reativar, o mesmo
          QR volta a funcionar.
        </p>
      </div>
      <Button
        variant={ativo ? "outline" : "default"}
        size="sm"
        onClick={alternar}
        disabled={pending}
      >
        {ativo ? "Desativar" : "Ativar"}
      </Button>
    </div>
  );
}
