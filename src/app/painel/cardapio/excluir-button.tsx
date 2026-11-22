"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CardapioState } from "./actions";

/**
 * Excluir com confirmação (não há como desfazer). Com `bloqueio`, o diálogo
 * só explica por que não dá pra excluir (ex.: categoria com produtos), sem o
 * botão de confirmar.
 */
export function ExcluirButton({
  id,
  acao,
  titulo,
  descricao,
  sucesso,
  bloqueio,
}: {
  id: string;
  acao: (formData: FormData) => Promise<CardapioState>;
  titulo: string;
  descricao: string;
  sucesso: string;
  bloqueio?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      const res = await acao(formData);
      if (res.ok) {
        setOpen(false);
        toast.success(sucesso);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível excluir.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label="Excluir"
        title="Excluir"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{bloqueio ? "Não é possível excluir" : titulo}</DialogTitle>
            <DialogDescription>{bloqueio ?? descricao}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {bloqueio ? "Entendi" : "Cancelar"}
            </Button>
            {bloqueio ? null : (
              <Button variant="destructive" onClick={confirmar} disabled={pending}>
                {pending ? "Excluindo…" : "Excluir definitivamente"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
