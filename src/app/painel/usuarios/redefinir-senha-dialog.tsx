"use client";

import { useActionState, useState } from "react";

import { Dices } from "lucide-react";
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

import { redefinirSenha, type UsuarioState } from "./actions";

const INITIAL: UsuarioState = { error: null, ok: false };

function gerarSenha() {
  const bloco = Math.random().toString(36).slice(2, 10);
  return `Pt07-${bloco}!Aa1`;
}

export function RedefinirSenhaDialog({
  usuario,
}: {
  usuario: { id: string; nome: string };
}) {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState("");

  const [state, formAction, pending] = useActionState(
    async (prev: UsuarioState, formData: FormData) => {
      const result = await redefinirSenha(prev, formData);
      if (result.ok) {
        toast.success(`Senha de ${usuario.nome} redefinida.`);
        setOpen(false);
        setSenha("");
      }
      return result;
    },
    INITIAL,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSenha("");
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Redefinir senha
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha de {usuario.nome}</DialogTitle>
          <DialogDescription>
            Defina uma senha nova e avise a pessoa por fora do sistema — não tem
            como ela receber isso automaticamente (sem e-mail de recuperação
            configurado).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={usuario.id} />

          <div className="space-y-2">
            <Label htmlFor="senha">Senha nova</Label>
            <div className="flex gap-2">
              <Input
                id="senha"
                name="senha"
                type="text"
                minLength={6}
                required
                autoFocus
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Gerar senha aleatória"
                onClick={() => setSenha(gerarSenha())}
              >
                <Dices className="size-4" />
              </Button>
            </div>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Redefinir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
