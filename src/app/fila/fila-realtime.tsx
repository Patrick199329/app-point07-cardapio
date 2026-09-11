"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BellRing, Check, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type ChamadoFila = {
  id: string;
  mesaId: string;
  identificador: string;
  criadoEm: string;
};

function tocarBip() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    setTimeout(() => void ctx.close(), 700);
  } catch {
    // AudioContext bloqueado até uma interação do usuário — silencioso.
  }
}

function haQuantoTempo(iso: string, agora: number) {
  const min = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
  if (min < 1) return "agora";
  if (min === 1) return "há 1 min";
  return `há ${min} min`;
}

export function FilaRealtime({
  inicial,
  mesas,
  meusHoje,
}: {
  inicial: ChamadoFila[];
  mesas: Record<string, string>;
  meusHoje: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [fila, setFila] = useState<ChamadoFila[]>(inicial);
  const [atendidos, setAtendidos] = useState(meusHoje);
  const [somAtivo, setSomAtivo] = useState(true);
  const [agora, setAgora] = useState(() => Date.now());
  const somRef = useRef(true);

  useEffect(() => {
    somRef.current = somAtivo;
  }, [somAtivo]);

  // Relógio para o "há N min".
  useEffect(() => {
    const iv = setInterval(() => setAgora(Date.now()), 20000);
    return () => clearInterval(iv);
  }, []);

  // Título da aba com o contador.
  useEffect(() => {
    document.title =
      fila.length > 0 ? `(${fila.length}) Fila — Point07` : "Fila — Point07";
  }, [fila.length]);

  // Assinatura Realtime dos chamados.
  useEffect(() => {
    const canal = supabase
      .channel("fila-chamados")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chamados" },
        (payload) => {
          const nova = payload.new as {
            id: string;
            mesa_id: string;
            status: string;
            criado_em: string;
          };
          if (nova.status !== "pendente") return;
          setFila((atual) => {
            if (atual.some((c) => c.id === nova.id)) return atual;
            return [
              ...atual,
              {
                id: nova.id,
                mesaId: nova.mesa_id,
                identificador: mesas[nova.mesa_id] ?? "Mesa",
                criadoEm: nova.criado_em,
              },
            ];
          });
          if (somRef.current) tocarBip();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chamados" },
        (payload) => {
          const linha = payload.new as { id: string; status: string };
          if (linha.status !== "pendente") {
            setFila((atual) => atual.filter((c) => c.id !== linha.id));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [supabase, mesas]);

  const aceitar = useCallback(
    async (chamado: ChamadoFila) => {
      setFila((atual) => atual.filter((c) => c.id !== chamado.id));
      const { data, error } = await supabase.rpc("aceitar_chamado", {
        p_id: chamado.id,
      });
      const res = data?.[0];
      if (error || !res?.ok) {
        toast.error(
          res?.motivo === "ja_aceito"
            ? "Outro garçom já pegou esse chamado."
            : "Não foi possível aceitar o chamado.",
        );
        return;
      }
      setAtendidos((n) => n + 1);
      toast.success(`Chamado da ${chamado.identificador} — pode ir.`);
    },
    [supabase],
  );

  const ordenada = [...fila].sort(
    (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {atendidos} atendimento(s) seu(s) hoje
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSomAtivo((s) => !s)}
          aria-pressed={somAtivo}
        >
          {somAtivo ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
          Som {somAtivo ? "ligado" : "desligado"}
        </Button>
      </div>

      {ordenada.length === 0 ? (
        <div className="rounded-xl border py-16 text-center">
          <BellRing className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum chamado no momento.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ordenada.map((chamado, i) => {
            const min = Math.floor(
              (agora - new Date(chamado.criadoEm).getTime()) / 60000,
            );
            return (
              <li
                key={chamado.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="text-lg font-semibold">
                    {i === 0 ? "→ " : ""}
                    {chamado.identificador}
                  </p>
                  <p
                    className={
                      min >= 5
                        ? "text-sm font-medium text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {haQuantoTempo(chamado.criadoEm, agora)}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="h-12 rounded-xl px-6"
                  onClick={() => aceitar(chamado)}
                >
                  <Check className="size-5" />
                  Aceitar
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
