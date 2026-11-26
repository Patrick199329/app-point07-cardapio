"use client";

import { type ReactElement, useActionState, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Selo } from "@/components/cardapio/selo";
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

import { atualizarSelo, criarSelo, type SeloState } from "./actions";

const INITIAL: SeloState = { error: null, ok: false };
const TEXTO_MAX = 24;

const CORES = [
  { valor: "laranja", rotulo: "Laranja", dica: "acompanha a cor de destaque do cardápio" },
  { valor: "preto", rotulo: "Preto", dica: "fixo" },
] as const;

export function SeloDialog({
  selo,
  trigger,
}: {
  selo?: { id: string; texto: string; cor: "laranja" | "preto" };
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(selo);
  const [texto, setTexto] = useState(selo?.texto ?? "");
  const [cor, setCor] = useState<"laranja" | "preto">(selo?.cor ?? "laranja");

  const [state, formAction, pending] = useActionState(
    async (prev: SeloState, formData: FormData) => {
      const result = await (isEdit ? atualizarSelo : criarSelo)(prev, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Selo atualizado." : "Selo criado.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  // O diálogo é reaproveitado entre aberturas: reinicia o formulário ao abrir.
  function aoAlterarAberto(aberto: boolean) {
    setOpen(aberto);
    if (aberto) {
      setTexto(selo?.texto ?? "");
      setCor(selo?.cor ?? "laranja");
    }
  }

  return (
    <Dialog open={open} onOpenChange={aoAlterarAberto}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar selo" : "Novo selo"}</DialogTitle>
          <DialogDescription>
            Texto curto que aparece num selo redondo sobre o produto (ex.: Indicação da casa).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {selo ? <input type="hidden" name="id" value={selo.id} /> : null}

          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
            <Selo
              texto={texto.trim() || "Seu texto"}
              cor={cor}
              estrelas
              className="size-24 shrink-0 -rotate-6 drop-shadow-md"
            />
            <p className="text-xs text-muted-foreground">
              Prévia. No cardápio o tamanho varia conforme o lugar (lista, destaques ou foto
              grande).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="texto">Texto do selo</Label>
              <span className="text-xs text-muted-foreground">
                {texto.length}/{TEXTO_MAX}
              </span>
            </div>
            <Input
              id="texto"
              name="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={TEXTO_MAX}
              required
              autoFocus
              placeholder="Ex.: Indicação da casa"
              className="h-10 md:h-9"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Cor</legend>
            <div className="grid grid-cols-2 gap-2">
              {CORES.map((c) => (
                <label
                  key={c.valor}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm ${
                    cor === c.valor ? "border-foreground ring-1 ring-foreground" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="cor"
                    value={c.valor}
                    checked={cor === c.valor}
                    onChange={() => setCor(c.valor)}
                    className="size-4"
                  />
                  <span>
                    <span className="font-medium">{c.rotulo}</span>
                    <span className="block text-xs text-muted-foreground">{c.dica}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

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
