"use client";

import { type ReactElement, useActionState, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { atualizarAviso, type CardapioState, criarAviso } from "../actions";

const INITIAL: CardapioState = { error: null, ok: false };

export function AvisoDialog({
  aviso,
  trigger,
}: {
  aviso?: { id: string; texto: string; fixo: boolean };
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(aviso);

  const [state, formAction, pending] = useActionState(
    async (prev: CardapioState, formData: FormData) => {
      const result = await (isEdit ? atualizarAviso : criarAviso)(
        prev,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Aviso atualizado." : "Aviso criado.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          <DialogDescription>
            Texto livre exibido no cardápio público (ex.: taxa de embalagem,
            couvert). Não é um item do cardápio.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {aviso ? <input type="hidden" name="id" value={aviso.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="texto">Texto</Label>
            <Textarea
              id="texto"
              name="texto"
              defaultValue={aviso?.texto ?? ""}
              rows={3}
              required
              autoFocus
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              name="fixo"
              value="true"
              defaultChecked={aviso?.fixo ?? true}
              className="mt-1 size-4"
            />
            <span>
              <span className="font-medium">Fixo na tela</span>
              <span className="block text-muted-foreground">
                Desmarcado: o aviso aparece só no fim da página.
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="h-10 md:h-9">
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
