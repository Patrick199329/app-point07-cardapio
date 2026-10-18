"use client";

import { useActionState } from "react";

import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { publicarCardapio, type PublicarState } from "./publicar-actions";

const INITIAL: PublicarState = { error: null, ok: false };

/**
 * Edições no painel (categorias, produtos, opções, avisos, aparência) ficam
 * só no rascunho até esse botão ser apertado — o cardápio público não muda
 * sozinho. Fica destacado (laranja sólido) quando há algo pendente; cinza e
 * desabilitado quando já está tudo publicado.
 */
export function PublicarButton({ pendente }: { pendente: boolean }) {
  const router = useRouter();

  const [state, formAction, aguardando] = useActionState(
    async (prev: PublicarState, formData: FormData) => {
      const result = await publicarCardapio(prev, formData);
      if (result.ok) {
        toast.success("Cardápio publicado — já está valendo pras mesas.");
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    INITIAL,
  );

  return (
    <form action={formAction}>
      <Button
        type="submit"
        size="sm"
        variant={pendente ? "default" : "outline"}
        disabled={!pendente || aguardando}
        className={pendente ? "shadow-sm" : "text-muted-foreground"}
      >
        <UploadCloud className="size-4" />
        {aguardando ? "Publicando…" : pendente ? "Publicar" : "Publicado"}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
