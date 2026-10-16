"use client";

import { useEffect, useState } from "react";

import { Bell, BellOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { desinscreverPushAtual } from "./push-cliente";
import { salvarInscricaoPush } from "./push-actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Estado = "indisponivel" | "negado" | "inativo" | "ativo" | "carregando";

/**
 * Depois que o navegador nega a permissão de notificação uma vez, o
 * JavaScript não consegue mais pedir de novo (bloqueio de segurança do
 * próprio navegador — nenhum site conseguiria, não é bug nosso). A única
 * saída é a pessoa reativar manualmente nas configurações do aparelho, e o
 * caminho muda por plataforma.
 */
function instrucoesParaReativar(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'No iPhone: Ajustes → Notificações → procure "Point07" (ou o nome que você deu ao adicionar à Tela de Início) → ative "Permitir Notificações". Se o app não aparecer na lista, confirme que ele foi adicionado à Tela de Início primeiro.';
  }
  if (/Android/i.test(ua)) {
    return "No Android: toque no ícone de cadeado (ou os três pontinhos) ao lado do endereço no navegador → Permissões do site → Notificações → mude para “Permitir”.";
  }
  return "No navegador: clique no ícone de cadeado ao lado do endereço do site → Permissões/Configurações do site → Notificações → mude para “Permitir”.";
}

/**
 * Opt-in de push do garçom (bônus não contratual — ver
 * docs/Push-Notificacoes-Garcom-Bonus.md). Some silenciosamente quando o
 * navegador não suporta Web Push (ex.: iPhone sem o app instalado na tela
 * de início).
 */
export function PushToggle() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [mostrarAjuda, setMostrarAjuda] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function checar() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("indisponivel");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("negado");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const sub = await registration.pushManager.getSubscription();
    setEstado(sub ? "ativo" : "inativo");
  }

  useEffect(() => {
    async function checarNaMontagem() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("indisponivel");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("negado");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const sub = await registration.pushManager.getSubscription();
      setEstado(sub ? "ativo" : "inativo");
    }
    void checarNaMontagem();
  }, []);

  async function ativar() {
    setEstado("carregando");
    setErro(null);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "inativo");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await salvarInscricaoPush(
        { endpoint: json.endpoint, keys: json.keys },
        navigator.userAgent,
      );
      setEstado("ativo");
    } catch (e) {
      setEstado("inativo");
      // iOS só permite push com o site instalado na Tela de Início
      // (standalone) — fora disso, subscribe() falha mesmo com permissão
      // concedida. Mostra isso em vez de engolir o erro.
      const standalone =
        "standalone" in navigator && (navigator as { standalone?: boolean }).standalone;
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setErro(
        isIOS && !standalone
          ? "No iPhone, notificações só funcionam com o site adicionado à Tela de Início (abra por esse atalho, não pelo Safari direto)."
          : `Não foi possível ativar: ${e instanceof Error ? e.message : "erro desconhecido"}.`,
      );
    }
  }

  async function desativar() {
    setEstado("carregando");
    try {
      await desinscreverPushAtual();
    } finally {
      setEstado("inativo");
    }
  }

  if (estado === "indisponivel") return null;

  if (estado === "negado") {
    return (
      <div className="text-right text-xs">
        <div className="flex items-center justify-end gap-2 text-muted-foreground">
          <BellOff className="size-3.5" />
          Notificações bloqueadas no navegador
        </div>
        <button
          type="button"
          className="text-primary underline underline-offset-2"
          onClick={() => setMostrarAjuda((v) => !v)}
        >
          {mostrarAjuda ? "Esconder" : "Como reativar?"}
        </button>
        {mostrarAjuda ? (
          <div className="mt-2 max-w-64 space-y-2 rounded-lg border bg-popover p-3 text-left text-muted-foreground">
            <p>{instrucoesParaReativar()}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setEstado("carregando");
                void checar();
              }}
            >
              Já ativei, verificar de novo
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="text-right">
      <Button
        variant="ghost"
        size="sm"
        disabled={estado === "carregando"}
        onClick={estado === "ativo" ? desativar : ativar}
        aria-pressed={estado === "ativo"}
      >
        {estado === "carregando" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : estado === "ativo" ? (
          <Bell className="size-4" />
        ) : (
          <BellOff className="size-4" />
        )}
        Notificações {estado === "ativo" ? "ativas" : "desativadas"}
      </Button>
      {erro ? (
        <p className="max-w-56 text-xs text-destructive">{erro}</p>
      ) : null}
    </div>
  );
}
