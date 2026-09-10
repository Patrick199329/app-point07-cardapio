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
import { NativeSelect } from "@/components/ui/native-select";
import type { Database } from "@/lib/types/database";

import { atualizarMesa, criarMesa, type MesaState } from "./actions";

type Mesa = Database["public"]["Tables"]["mesas"]["Row"];

const INITIAL: MesaState = { error: null, ok: false };

export function MesaDialog({
  mesa,
  trigger,
}: {
  mesa?: Mesa;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(mesa);

  const [state, formAction, pending] = useActionState(
    async (prev: MesaState, formData: FormData) => {
      const result = await (isEdit ? atualizarMesa : criarMesa)(prev, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Mesa atualizada." : "Mesa cadastrada.");
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
          <DialogTitle>{isEdit ? "Editar mesa" : "Nova mesa"}</DialogTitle>
          <DialogDescription>
            O identificador aparece para a equipe e deve ser único.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {mesa ? <input type="hidden" name="id" value={mesa.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="identificador">Identificador</Label>
            <Input
              id="identificador"
              name="identificador"
              defaultValue={mesa?.identificador ?? ""}
              placeholder="Mesa 12"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apelido">Apelido (opcional)</Label>
            <Input
              id="apelido"
              name="apelido"
              defaultValue={mesa?.apelido ?? ""}
              placeholder="Mesa do canto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área</Label>
            <NativeSelect
              id="area"
              name="area"
              defaultValue={mesa?.area ?? "interna"}
            >
              <option value="interna">Interna</option>
              <option value="externa">Externa</option>
            </NativeSelect>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
