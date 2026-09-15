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
  const { chamadoId } = event.notification.data ?? {};

  if (event.action === "aceitar" && chamadoId) {
    event.waitUntil(
      fetch("/api/chamados/aceitar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamadoId }),
      }).then(() => self.clients.openWindow("/fila")),
    );
    return;
  }

  event.waitUntil(self.clients.openWindow("/fila"));
});
