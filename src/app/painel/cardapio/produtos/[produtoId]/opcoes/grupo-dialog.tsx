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
import { Textarea } from "@/components/ui/textarea";

import { atualizarGrupo, criarGrupo, type OpcoesState } from "./actions";

const INITIAL: OpcoesState = { error: null, ok: false };

export function GrupoDialog({
  produtoId,
  grupo,
  trigger,
}: {
  produtoId: string;
  grupo?: { id: string; titulo: string; observacao: string | null };
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(grupo);

  const [state, formAction, pending] = useActionState(
    async (prev: OpcoesState, formData: FormData) => {
      const result = await (isEdit ? atualizarGrupo : criarGrupo)(
        prev,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Grupo atualizado." : "Grupo criado.");
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
          <DialogTitle>{isEdit ? "Editar grupo" : "Novo grupo"}</DialogTitle>
          <DialogDescription>
            Ex.: “Todas Acompanham”, “Escolha 1 Carne”. É só informativo — sem
            seleção nem cálculo no cardápio público.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="produto_id" value={produtoId} />
          {grupo ? <input type="hidden" name="id" value={grupo.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={grupo?.titulo ?? ""}
              placeholder="Escolha 1 Carne"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              name="observacao"
              defaultValue={grupo?.observacao ?? ""}
              placeholder="Será cobrado R$ 9,00 por acréscimo de carne"
              rows={2}
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
