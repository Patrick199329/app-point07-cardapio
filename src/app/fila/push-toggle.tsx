"use client";

import { useEffect, useState } from "react";

import { Bell, BellOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { removerInscricaoPush, salvarInscricaoPush } from "./push-actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Estado = "indisponivel" | "negado" | "inativo" | "ativo" | "carregando";

/**
 * Opt-in de push do garçom (bônus não contratual — ver
 * docs/Push-Notificacoes-Garcom-Bonus.md). Some silenciosamente quando o
 * navegador não suporta Web Push (ex.: iPhone sem o app instalado na tela
 * de início).
 */
export function PushToggle() {
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    let cancelado = false;
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
      if (!cancelado) setEstado(sub ? "ativo" : "inativo");
    }
    void checar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function ativar() {
    setEstado("carregando");
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
    } catch {
      setEstado("inativo");
    }
  }

  async function desativar() {
    setEstado("carregando");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await removerInscricaoPush(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setEstado("inativo");
    }
  }

  if (estado === "indisponivel") return null;

  if (estado === "negado") {
    return (
      <p className="text-xs text-muted-foreground">
        Notificações bloqueadas no navegador.
      </p>
    );
  }

  return (
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
  );
}
