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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  atualizarCategoria,
  type CardapioState,
  criarCategoria,
} from "./actions";

const INITIAL: CardapioState = { error: null, ok: false };

export function CategoriaDialog({
  categoria,
  trigger,
}: {
  categoria?: { id: string; nome: string };
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(categoria);

  const [state, formAction, pending] = useActionState(
    async (prev: CardapioState, formData: FormData) => {
      const result = await (isEdit ? atualizarCategoria : criarCategoria)(
        prev,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Categoria atualizada." : "Categoria criada.");
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
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            A ordem das categorias é ajustada pelas setas na lista.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {categoria ? (
            <input type="hidden" name="id" value={categoria.id} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={categoria?.nome ?? ""}
              placeholder="Bebidas"
              required
              autoFocus
              className="h-10 md:h-9"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

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
