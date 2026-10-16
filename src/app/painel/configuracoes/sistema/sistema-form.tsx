"use client";

import { useActionState, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { salvarIdentidadeSistema, type SistemaState } from "./actions";

const INITIAL: SistemaState = { error: null, ok: false };

export function SistemaForm({
  logoUrl,
  faviconUrl,
}: {
  logoUrl: string | null;
  faviconUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [removida, setRemovida] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(faviconUrl);
  const [faviconRemovido, setFaviconRemovido] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (prev: SistemaState, formData: FormData) => {
      const result = await salvarIdentidadeSistema(prev, formData);
      if (result.ok) {
        toast.success("Identidade do sistema salva.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  function removerLogo() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setRemovida(true);
  }

  function removerFavicon() {
    if (faviconRef.current) faviconRef.current.value = "";
    setFaviconPreview(null);
    setFaviconRemovido(true);
  }

  return (
    <form action={formAction} className="max-w-md space-y-5">
      {removida ? <input type="hidden" name="remover_logo" value="true" /> : null}
      {faviconRemovido ? (
        <input type="hidden" name="remover_favicon" value="true" />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="logo">Logo do sistema</Label>
        {preview ? (
          <div className="flex items-center gap-4 rounded-lg border p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="h-16 w-auto max-w-40 object-contain"
            />
            <Button type="button" variant="ghost" size="sm" onClick={removerLogo}>
              Remover
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Sem logo — a tela de login e o painel mostram o texto “Point07”.
          </p>
        )}
        <Input
          ref={fileRef}
          id="logo"
          name="logo"
          type="file"
          accept="image/*"
          className="h-10 md:h-9"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setPreview(URL.createObjectURL(f));
              setRemovida(false);
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Aparece na tela de login, no menu do painel e no cabeçalho da fila do
          garçom. Convertida automaticamente para WebP.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="favicon">Favicon (ícone da aba do navegador)</Label>
        {faviconPreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconPreview}
              alt=""
              className="size-8 rounded border object-contain p-0.5"
            />
            <Button type="button" variant="ghost" size="sm" onClick={removerFavicon}>
              Remover
            </Button>
          </div>
        ) : null}
        <Input
          ref={faviconRef}
          id="favicon"
          name="favicon"
          type="file"
          accept="image/*"
          className="h-10 md:h-9"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFaviconPreview(URL.createObjectURL(f));
              setFaviconRemovido(false);
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Aparece na aba do navegador em todas as páginas (cardápio público e
          painel). Use uma imagem quadrada.
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
