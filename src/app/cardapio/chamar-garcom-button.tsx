"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BellRing, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Estado = "idle" | "enviando" | "pendente" | "aceito" | "erro";

/**
 * Widget "Chamar garçom" do cardápio público (Módulo 3). Funciona direto do
 * navegador com o cliente anon: as RPCs criar_chamado / status_chamado /
 * cancelar_chamado são SECURITY DEFINER e liberadas para `anon`.
 *
 * Sem persistência local: o dedup de 90s da RPC criar_chamado já devolve o mesmo
 * chamado pendente se o cliente recarregar e tocar de novo.
 */
export function ChamarGarcomButton({
  mesaToken,
  mesaIdentificador,
  corDestaque,
}: {
  mesaToken: string | null;
  mesaIdentificador?: string;
  /** Cor de marca (`cardapio_config.cor_destaque`) — mesma usada no resto do cardápio. */
  corDestaque?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<Estado>("idle");
  const [garcom, setGarcom] = useState<string | null>(null);
  const chamadoRef = useRef<{ id: string; origem: string } | null>(null);

  // Poll do status enquanto pendente.
  useEffect(() => {
    if (estado !== "pendente" || !chamadoRef.current) return;
    const { id, origem } = chamadoRef.current;
    let parado = false;

    const tick = async () => {
      const { data } = await supabase.rpc("status_chamado", {
        p_id: id,
        p_origem_token: origem,
      });
      if (parado) return;
      const row = data?.[0];
      if (!row) return;
      if (row.status === "aceito") {
        setGarcom(row.garcom_nome ?? null);
        setEstado("aceito");
      } else if (row.status === "cancelado") {
        chamadoRef.current = null;
        setEstado("idle");
      }
    };

    const iv = setInterval(tick, 4000);
    void tick();
    return () => {
      parado = true;
      clearInterval(iv);
    };
  }, [estado, supabase]);

  // Volta ao início alguns segundos depois de aceito.
  useEffect(() => {
    if (estado !== "aceito") return;
    const t = setTimeout(() => {
      chamadoRef.current = null;
      setGarcom(null);
      setEstado("idle");
    }, 12000);
    return () => clearTimeout(t);
  }, [estado]);

  const chamar = useCallback(async () => {
    if (!mesaToken) return;
    setEstado("enviando");
    const { data, error } = await supabase.rpc("criar_chamado", {
      p_token: mesaToken,
    });
    const row = data?.[0];
    if (error || !row) {
      setEstado("erro");
      return;
    }
    chamadoRef.current = { id: row.chamado_id, origem: row.origem_token };
    setEstado("pendente");

    // Bônus não contratual (docs/Push-Notificacoes-Garcom-Bonus.md): avisa os
    // garçons inscritos. Best-effort — se falhar, o chamado já está na fila
    // via Realtime de qualquer forma.
    if (!row.ja_existia) {
      fetch("/api/chamados/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chamadoId: row.chamado_id,
          mesa: mesaIdentificador ?? "Uma mesa",
        }),
      }).catch(() => {});
    }
  }, [mesaIdentificador, mesaToken, supabase]);

  const cancelar = useCallback(async () => {
    const c = chamadoRef.current;
    chamadoRef.current = null;
    setEstado("idle");
    if (c) {
      await supabase.rpc("cancelar_chamado", {
        p_id: c.id,
        p_origem_token: c.origem,
      });
    }
  }, [supabase]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        {!mesaToken ? (
          <p className="px-1 py-2 text-center text-sm text-muted-foreground">
            Escaneie o QR code da sua mesa para chamar o garçom pelo app.
          </p>
        ) : estado === "pendente" ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <BellRing className="size-4" style={{ color: corDestaque }} />
              Garçom chamado — já vem!
            </p>
            <Button variant="ghost" size="sm" onClick={cancelar}>
              Cancelar
            </Button>
          </div>
        ) : estado === "aceito" ? (
          <p className="flex items-center justify-center gap-2 py-2 text-sm font-medium">
            <Check className="size-4" style={{ color: corDestaque }} />
            {garcom ? `${garcom} está a caminho` : "Um garçom está a caminho"} 🎉
          </p>
        ) : (
          <>
            <Button
              className="h-12 w-full rounded-xl text-base"
              style={corDestaque ? { backgroundColor: corDestaque, color: "#fff" } : undefined}
              onClick={chamar}
              disabled={estado === "enviando"}
            >
              {estado === "enviando" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <BellRing className="size-5" />
              )}
              {estado === "enviando" ? "Chamando…" : "Chamar garçom"}
            </Button>
            {estado === "erro" ? (
              <p className="mt-2 text-center text-sm text-destructive">
                Não foi possível chamar agora. Tente de novo.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
