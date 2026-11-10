"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Mesa = { id: string; identificador: string };

export function EscolherMesa({ token, mesas }: { token: string; mesas: Mesa[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [escolhida, setEscolhida] = useState<Mesa | null>(null);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // "Mesa 2" antes de "Mesa 10" (ordem numérica, não alfabética).
  const ordenadas = useMemo(
    () =>
      [...mesas].sort((a, b) =>
        a.identificador.localeCompare(b.identificador, "pt-BR", { numeric: true }),
      ),
    [mesas],
  );

  async function confirmar() {
    if (!escolhida) return;
    setIndo(true);
    setErro(null);
    const { data, error } = await supabase.rpc("mesa_token_por_qr_universal", {
      p_token: token,
      p_mesa_id: escolhida.id,
    });
    if (error || !data) {
      setIndo(false);
      setErro("Não foi possível abrir essa mesa agora. Tente de novo.");
      return;
    }
    router.replace(`/mesa/${data}`);
  }

  if (escolhida) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="text-sm text-muted-foreground">Você está na</p>
        <p className="mt-1 text-2xl font-semibold">{escolhida.identificador}?</p>
        <div className="mt-6 space-y-2">
          <Button
            className="h-12 w-full rounded-xl text-base"
            onClick={confirmar}
            disabled={indo}
          >
            {indo ? <Loader2 className="size-5 animate-spin" /> : null}
            Sim, é essa
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full"
            onClick={() => setEscolhida(null)}
            disabled={indo}
          >
            Trocar de mesa
          </Button>
        </div>
        {erro ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {erro}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-xl font-semibold">Em qual mesa você está?</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Escolha a sua mesa para ver o cardápio e chamar o garçom.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {ordenadas.map((m) => (
          <li key={m.id}>
            <Button
              variant="outline"
              className="h-14 w-full rounded-xl text-base"
              onClick={() => setEscolhida(m)}
            >
              {m.identificador}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
