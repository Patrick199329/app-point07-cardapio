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

import { atualizarUsuario, criarUsuario, type UsuarioState } from "./actions";

type Usuario = {
  id: string;
  nome: string;
  email: string | null;
  role: "admin" | "garcom";
};

const INITIAL: UsuarioState = { error: null, ok: false };

export function UsuarioDialog({
  usuario,
  trigger,
}: {
  usuario?: Usuario;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(usuario);

  const [state, formAction, pending] = useActionState(
    async (prev: UsuarioState, formData: FormData) => {
      const result = await (isEdit ? atualizarUsuario : criarUsuario)(
        prev,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Usuário atualizado." : "Usuário criado.");
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
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "O e-mail de acesso não é alterado por aqui."
              : "O usuário entra com o e-mail e a senha definidos abaixo."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {usuario ? <input type="hidden" name="id" value={usuario.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={usuario?.nome ?? ""}
              required
              autoFocus
            />
          </div>

          {!isEdit ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha inicial</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="text"
                  minLength={6}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <NativeSelect
              id="role"
              name="role"
              defaultValue={usuario?.role ?? "garcom"}
            >
              <option value="garcom">Garçom</option>
              <option value="admin">Administrador</option>
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
