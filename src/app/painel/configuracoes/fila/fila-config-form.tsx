"use client";

import { useActionState, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { salvarConfigFila, type FilaConfigState } from "./actions";

const INITIAL: FilaConfigState = { error: null, ok: false };

export function FilaConfigForm({
  minutosIniciais,
  segundosIniciais,
  atendimentoMinutosInicial,
  intervaloSegundosInicial,
  chamadaAtivaInicial,
}: {
  minutosIniciais: number;
  segundosIniciais: number;
  atendimentoMinutosInicial: number;
  intervaloSegundosInicial: number;
  chamadaAtivaInicial: boolean;
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

  const [chamadaAtiva, setChamadaAtiva] = useState(chamadaAtivaInicial);

  return (
    <form action={formAction} className="max-w-sm space-y-5">
      <input type="hidden" name="chamada_ativa" value={chamadaAtiva ? "true" : "false"} />

      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="space-y-1">
          <Label htmlFor="chamada_ativa_switch">Chamada de garçom pelo cardápio</Label>
          <p className="text-xs text-muted-foreground">
            Ligada: o cliente vê o botão &ldquo;Chamar garçom&rdquo; no cardápio da mesa.
            Desligada: o botão some e novos chamados deixam de ser aceitos (mesmo em
            telas já abertas). O que já está na fila continua normal.
          </p>
        </div>
        <Switch
          id="chamada_ativa_switch"
          checked={chamadaAtiva}
          onCheckedChange={setChamadaAtiva}
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="atendimento_minutos">
          Tempo máximo de um atendimento
        </Label>
        <div className="flex items-end gap-3">
          <Input
            id="atendimento_minutos"
            name="atendimento_minutos"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            defaultValue={atendimentoMinutosInicial}
            className="h-10 w-20 md:h-9"
          />
          <span className="pb-2 text-sm text-muted-foreground md:pb-1.5">
            minutos
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Se o garçom esquecer de finalizar, o atendimento é encerrado
          automaticamente depois desse tempo (e fica fora das médias de
          duração).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intervalo_segundos">
          Intervalo para a mesa chamar de novo
        </Label>
        <div className="flex items-end gap-3">
          <Input
            id="intervalo_segundos"
            name="intervalo_segundos"
            type="number"
            inputMode="numeric"
            min={0}
            max={3600}
            defaultValue={intervaloSegundosInicial}
            className="h-10 w-24 md:h-9"
          />
          <span className="pb-2 text-sm text-muted-foreground md:pb-1.5">
            segundos
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Depois que um garçom aceita o chamado, a mesa só consegue chamar de
          novo após esse tempo. Use 0 para não ter intervalo.
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
