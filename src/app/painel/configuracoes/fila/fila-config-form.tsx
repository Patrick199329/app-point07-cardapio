"use client";

import { useActionState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { salvarConfigFila, type FilaConfigState } from "./actions";

const INITIAL: FilaConfigState = { error: null, ok: false };

export function FilaConfigForm({
  minutosIniciais,
  segundosIniciais,
}: {
  minutosIniciais: number;
  segundosIniciais: number;
}) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (prev: FilaConfigState, formData: FormData) => {
      const result = await salvarConfigFila(prev, formData);
      if (result.ok) {
        toast.success("Configuração da fila salva.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-5">
      <div className="space-y-2">
        <Label>Tempo limite antes do destaque</Label>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="minutos" className="text-xs text-muted-foreground">
              Minutos
            </Label>
            <Input
              id="minutos"
              name="minutos"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              defaultValue={minutosIniciais}
              className="h-10 w-20 md:h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="segundos" className="text-xs text-muted-foreground">
              Segundos
            </Label>
            <Input
              id="segundos"
              name="segundos"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              defaultValue={segundosIniciais}
              className="h-10 w-20 md:h-9"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Quando um chamado pendente passar desse tempo sem ser aceito, o
          cartão dele fica em vermelho na fila do garçom.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-10 md:h-9">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
