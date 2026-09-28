import { removerInscricaoPush } from "./push-actions";

/**
 * Cancela a inscrição de push (bônus) do dispositivo atual, se houver — usada
 * tanto no botão "Notificações" (opt-out manual) quanto no logout (pra um
 * garçom deslogado parar de receber push nesse aparelho). Silenciosa: sem
 * suporte a push, sem inscrição, ou sem sessão pra apagar a linha, não falha
 * o logout por causa disso.
 */
export async function desinscreverPushAtual() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await registration?.pushManager.getSubscription();
    if (!sub) return;
    await removerInscricaoPush(sub.endpoint).catch(() => {});
    await sub.unsubscribe();
  } catch {
    // best-effort — não bloqueia o logout/toggle por causa disso.
  }
}
