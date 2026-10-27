// Service worker do Point07 — só existe pro bônus de push do garçom
// (docs/Push-Notificacoes-Garcom-Bonus.md). Sem cache/offline: cada request
// segue direto pra rede, esse arquivo só escuta push e clique de notificação.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { mesa, chamadoId } = payload;
  event.waitUntil(
    self.registration.showNotification(`${mesa ?? "Mesa"} chamou o garçom`, {
      body: "Toque para aceitar ou ir até a fila.",
      icon: "/marca/logo-point07-preta.png",
      tag: chamadoId,
      renotify: true,
      // Repetido, pra se notar num bar barulhento (só Android — iPhone não
      // deixa site nenhum controlar vibração, nem em notificação push).
      vibrate: [300, 150, 300, 150, 300],
      actions: [
        { action: "aceitar", title: "Aceitar" },
        { action: "ir", title: "Ir até a fila" },
      ],
      data: { mesa, chamadoId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { mesa, chamadoId } = event.notification.data ?? {};

  if (event.action === "aceitar" && chamadoId) {
    // Aceita direto da notificação, sem abrir nada. Se o aceite não rolar por
    // motivo de regra (outro garçom pegou, garçom já em atendimento), avisa
    // por notificação. Se for falha técnica (sessão, rede), abre a fila com
    // ?aceitar=<id> — a própria fila tenta o aceite de dentro do navegador.
    const avisar = (titulo, corpo) =>
      self.registration.showNotification(titulo, {
        body: corpo,
        icon: "/marca/logo-point07-preta.png",
        tag: chamadoId,
      });
    const abrirFilaAceitando = () =>
      self.clients.openWindow(`/fila?aceitar=${encodeURIComponent(chamadoId)}`);

    event.waitUntil(
      fetch("/api/chamados/aceitar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamadoId }),
      })
        .then((res) => res.json().catch(() => ({ ok: false })))
        .then((resultado) => {
          if (resultado.ok) {
            return avisar(
              `${mesa ?? "Mesa"} — aceito`,
              "Chamado aceito. Pode ir até a mesa.",
            );
          }
          if (resultado.motivo === "ja_aceito") {
            return avisar(
              `${mesa ?? "Mesa"} — já atendida`,
              "Outro garçom já pegou esse chamado.",
            );
          }
          if (resultado.motivo === "em_atendimento") {
            return avisar(
              "Você está em atendimento",
              "Finalize o atendimento em andamento na fila para aceitar outro.",
            );
          }
          return abrirFilaAceitando();
        })
        .catch(() => abrirFilaAceitando()),
    );
    return;
  }

  event.waitUntil(self.clients.openWindow("/fila"));
});
