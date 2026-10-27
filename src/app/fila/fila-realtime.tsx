"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BellRing, Check, CircleCheck, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatarHora } from "@/lib/formato";
import { createClient } from "@/lib/supabase/client";

import { PushToggle } from "./push-toggle";

export type ChamadoFila = {
  id: string;
  mesaId: string;
  identificador: string;
  criadoEm: string;
  /** `aceito` no banco = "Em atendimento" na tela. */
  status: "pendente" | "aceito";
  garcomId: string | null;
  aceitoEm: string | null;
};

// Com que frequência a fila pede ao banco para finalizar atendimentos que
// estouraram o tempo máximo (fila_config.atendimento_max_minutos). Não há
// pg_cron — qualquer fila aberta serve de relógio, e o UPDATE chega a todos
// via Realtime.
const INTERVALO_EXPIRAR_MS = 30_000;

// Padrão de vibração do alerta — repetido, pra se notar num bar barulhento.
// Só funciona em Android (iPhone não deixa site nenhum controlar vibração).
const PADRAO_VIBRACAO = [300, 150, 300, 150, 300];

/**
 * Três bipes (não um só) com onda quadrada — mais estridente e insistente
 * que um tom único em seno, pra cortar o barulho de ambiente de bar. Pedido
 * do cliente depois de testar num ambiente real e achar o som baixo demais.
 */
function tocarBip() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((atraso) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 1000;
      const inicio = ctx.currentTime + atraso;
      gain.gain.setValueAtTime(0.5, inicio);
      gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.25);
      osc.start(inicio);
      osc.stop(inicio + 0.25);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    // AudioContext bloqueado até uma interação do usuário — silencioso.
  }
  if ("vibrate" in navigator) navigator.vibrate(PADRAO_VIBRACAO);
}

/** Cronômetro mm:ss decorrido desde `iso`. */
function formatarCronometro(iso: string, agora: number) {
  const totalSeg = Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 1000));
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

export function FilaRealtime({
  inicial,
  mesas,
  meusHoje,
  alertaAtrasoSegundos,
  userId,
  veTodos,
  nomesGarcons,
}: {
  inicial: ChamadoFila[];
  mesas: Record<string, string>;
  meusHoje: number;
  alertaAtrasoSegundos: number;
  userId: string;
  /** Admin/Gerente: enxerga os atendimentos de todos os garçons. */
  veTodos: boolean;
  nomesGarcons: Record<string, string>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [fila, setFila] = useState<ChamadoFila[]>(inicial);
  const [nomes, setNomes] = useState(nomesGarcons);
  const [atendidos, setAtendidos] = useState(meusHoje);
  const [somAtivo, setSomAtivo] = useState(true);
  const [agora, setAgora] = useState(() => Date.now());
  const [processando, setProcessando] = useState<string | null>(null);
  const somRef = useRef(true);

  const meuAtendimento = fila.find(
    (c) => c.status === "aceito" && c.garcomId === userId,
  );
  // Quem está em atendimento não é avisado de chamado novo (regra do cliente).
  const ocupadoRef = useRef(false);

  useEffect(() => {
    somRef.current = somAtivo;
  }, [somAtivo]);

  useEffect(() => {
    ocupadoRef.current = !!meuAtendimento;
  }, [meuAtendimento]);

  // Finaliza no banco os atendimentos que passaram do tempo máximo.
  useEffect(() => {
    const iv = setInterval(() => {
      void supabase.rpc("finalizar_chamados_expirados");
    }, INTERVALO_EXPIRAR_MS);
    return () => clearInterval(iv);
  }, [supabase]);

  // Cronômetro mm:ss de cada chamado — precisa de tique por segundo.
  useEffect(() => {
    const iv = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const pendentes = fila.filter((c) => c.status === "pendente");
  const emAtendimento = fila.filter((c) => c.status === "aceito");

  // Título da aba com o contador de chamados aguardando.
  useEffect(() => {
    document.title =
      pendentes.length > 0
        ? `(${pendentes.length}) Fila — Point07`
        : "Fila — Point07";
  }, [pendentes.length]);

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
                status: "pendente",
                garcomId: null,
                aceitoEm: null,
              },
            ];
          });
          if (somRef.current && !ocupadoRef.current) tocarBip();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chamados" },
        (payload) => {
          const linha = payload.new as {
            id: string;
            mesa_id: string;
            status: string;
            criado_em: string;
            garcom_id: string | null;
            aceito_em: string | null;
          };

          if (linha.status !== "aceito") {
            // cancelado / finalizado (ou pendente, que não volta a acontecer)
            if (linha.status !== "pendente") {
              setFila((atual) => atual.filter((c) => c.id !== linha.id));
            }
            return;
          }

          // Em atendimento: o garçom só acompanha o próprio; Admin/Gerente, todos.
          if (!veTodos && linha.garcom_id !== userId) {
            setFila((atual) => atual.filter((c) => c.id !== linha.id));
            return;
          }
          setFila((atual) => {
            const virou: ChamadoFila = {
              id: linha.id,
              mesaId: linha.mesa_id,
              identificador: mesas[linha.mesa_id] ?? "Mesa",
              criadoEm: linha.criado_em,
              status: "aceito",
              garcomId: linha.garcom_id,
              aceitoEm: linha.aceito_em,
            };
            return atual.some((c) => c.id === linha.id)
              ? atual.map((c) => (c.id === linha.id ? virou : c))
              : [...atual, virou];
          });

          const gid = linha.garcom_id;
          if (veTodos && gid) {
            void supabase
              .from("profiles")
              .select("nome")
              .eq("id", gid)
              .single()
              .then(({ data }) => {
                if (data) setNomes((n) => ({ ...n, [gid]: data.nome }));
              });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [supabase, mesas, userId, veTodos]);

  const aceitar = useCallback(
    async (chamado: ChamadoFila) => {
      setProcessando(chamado.id);
      const { data, error } = await supabase.rpc("aceitar_chamado", {
        p_id: chamado.id,
      });
      setProcessando(null);
      const res = data?.[0];
      if (error || !res?.ok) {
        if (res?.motivo === "ja_aceito") {
          setFila((atual) => atual.filter((c) => c.id !== chamado.id));
          toast.error("Outro garçom já pegou esse chamado.");
        } else if (res?.motivo === "em_atendimento") {
          toast.error("Finalize o atendimento em andamento antes de aceitar outro.");
        } else {
          toast.error("Não foi possível aceitar o chamado.");
        }
        return;
      }
      setFila((atual) =>
        atual.map((c) =>
          c.id === chamado.id
            ? {
                ...c,
                status: "aceito",
                garcomId: userId,
                aceitoEm: new Date().toISOString(),
              }
            : c,
        ),
      );
      setAtendidos((n) => n + 1);
      toast.success(`Chamado da ${chamado.identificador} — pode ir.`);
    },
    [supabase, userId],
  );

  const finalizar = useCallback(
    async (chamado: ChamadoFila) => {
      setProcessando(chamado.id);
      const { data, error } = await supabase.rpc("finalizar_chamado", {
        p_id: chamado.id,
      });
      setProcessando(null);
      const res = data?.[0];
      if (error || !res?.ok) {
        // Já finalizado (ex.: automaticamente) — o card some de qualquer forma.
        if (res?.motivo === "nao_esta_em_atendimento") {
          setFila((atual) => atual.filter((c) => c.id !== chamado.id));
        }
        toast.error("Não foi possível finalizar o atendimento.");
        return;
      }
      setFila((atual) => atual.filter((c) => c.id !== chamado.id));
      toast.success(`Atendimento da ${chamado.identificador} finalizado.`);
    },
    [supabase],
  );

  const ordenada = [...pendentes].sort(
    (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
  );
  const atendimentos = [...emAtendimento].sort(
    (a, b) =>
      new Date(a.aceitoEm ?? a.criadoEm).getTime() -
      new Date(b.aceitoEm ?? b.criadoEm).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {atendidos} atendimento(s) seu(s) hoje
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <PushToggle />
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
      </div>

      {atendimentos.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Em atendimento ({atendimentos.length})
          </h2>
          <ul className="space-y-3">
            {atendimentos.map((c) => {
              const meu = c.garcomId === userId;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
                >
                  <div>
                    <p className="text-lg font-semibold">{c.identificador}</p>
                    <p className="text-xs text-muted-foreground">
                      {meu
                        ? "Você está atendendo"
                        : `Atendendo: ${(c.garcomId && nomes[c.garcomId]) || "Garçom"}`}
                    </p>
                    <p className="font-mono text-sm text-muted-foreground tabular-nums">
                      {formatarCronometro(c.aceitoEm ?? c.criadoEm, agora)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant={meu ? "default" : "outline"}
                    className="h-12 rounded-xl px-6"
                    disabled={processando === c.id}
                    onClick={() => finalizar(c)}
                  >
                    <CircleCheck className="size-5" />
                    Finalizar
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {meuAtendimento ? (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Você está em atendimento: finalize para aceitar novos chamados e
          voltar a receber avisos.
        </p>
      ) : null}

      <h2 className="text-sm font-semibold text-muted-foreground">
        Aguardando ({ordenada.length})
      </h2>
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
            const decorridoSeg = Math.floor(
              (agora - new Date(chamado.criadoEm).getTime()) / 1000,
            );
            const atrasado = decorridoSeg >= alertaAtrasoSegundos;
            return (
              <li
                key={chamado.id}
                className={
                  atrasado
                    ? "flex items-center justify-between gap-3 rounded-xl border border-destructive bg-destructive/10 p-4"
                    : "flex items-center justify-between gap-3 rounded-xl border p-4"
                }
              >
                <div>
                  <p className="text-lg font-semibold">
                    {i === 0 ? "→ " : ""}
                    {chamado.identificador}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chamou às {formatarHora(chamado.criadoEm)}
                  </p>
                  <p
                    className={
                      atrasado
                        ? "font-mono text-sm font-semibold text-destructive tabular-nums"
                        : "font-mono text-sm text-muted-foreground tabular-nums"
                    }
                  >
                    {formatarCronometro(chamado.criadoEm, agora)}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="h-12 rounded-xl px-6"
                  disabled={!!meuAtendimento || processando === chamado.id}
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
