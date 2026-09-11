# Push de notificação para o Garçom — funcionalidade bônus (pendente)

> Status: **planejado, não iniciado**. Decisão do Patrick (10/09/2026): entra na fila de
> trabalho **depois do Módulo 5 (Painel Gerencial)**. Este documento existe pra não perder o
> raciocínio até lá.

## Contexto e decisão

O Patrick perguntou se dava pra implementar push de notificação para alertar os garçons na
Chamada de Garçom (Módulo 3), com um botão de ação tipo **"Ir até a mesa"** / **"Aceitar"**
já na própria notificação.

⚠️ **Ponto contratual:** o contrato assinado exclui expressamente "notificação por push do
sistema operacional ou por WhatsApp ao garçom" (`00-contexto-e-escopo.md`,
`02-notas-tecnicas.md`). O Patrick já tinha revisitado esse ponto durante o planejamento e
decidiu manter a exclusão no contrato assinado. Diante disso, a decisão agora foi: **fazer
como bônus não cobrado**, não como entrega contratual — o cliente (Aquiles) deve saber que é
um extra e que tem uma limitação real no iPhone (abaixo), pra não criar expectativa de que é
garantido em qualquer aparelho.

## Viabilidade técnica (resumo)

- **Custo de licenciamento: zero.** Web Push é padrão aberto do navegador (RFC 8030 +
  Notification API) — não depende de Firebase, OneSignal nem nenhum serviço pago. Só a lib
  `web-push` (open source) + chaves VAPID (geradas localmente, sem cadastro externo).
- **Custo real é desenvolvimento** — não é trivial, mas reaproveita a infra do Módulo 3
  (RPC `aceitar_chamado`, tabela `chamados`, Realtime já configurados).
- **Suporte por aparelho do garçom:**
  | Aparelho | Botão de ação direto da notificação |
  |---|---|
  | Android (Chrome) | ✅ funciona bem |
  | Desktop (Chrome/Edge/Firefox) | ✅ funciona bem |
  | iPhone (Safari/iOS) | ⚠️ só recebe push se o app estiver **instalado na tela de início**; botões de ação na notificação são inconsistentes — tocar normalmente abre o app, que aí sim aceita o chamado |
  - Isso cruza com a pendência já registrada em `00-contexto-e-escopo.md`: **qual será o
    aparelho do garçom** (tela fixa, celular do restaurante, ou pessoal — e se iOS).
- **Depende de domínio real com HTTPS** — push não funciona em produção sem isso. Dá pra
  construir e testar em `localhost` (exceção de "contexto seguro" do navegador), mas o teste
  de verdade no celular do garçom só é possível com o domínio da Fase 6/7 no ar.

## Arquitetura proposta (quando formos implementar)

### 1. Tabela de inscrições — nova migration
```sql
create table public.push_inscricoes (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references public.profiles (id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth_key     text not null,
  user_agent   text,
  created_at   timestamptz not null default now()
);
-- RLS: cada usuário gerencia só as próprias inscrições (insert/select/delete own);
-- leitura de todas as inscrições de garçons só via service_role (para o envio).
```

### 2. Chaves VAPID
- Gerar uma vez (`npx web-push generate-vapid-keys`), guardar em env:
  `VAPID_PUBLIC_KEY` (também como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, usada no browser),
  `VAPID_PRIVATE_KEY` (server-only), `VAPID_SUBJECT` (`mailto:...`).

### 3. Opt-in do garçom (`/fila`)
- Botão "Ativar notificações" → `Notification.requestPermission()` → registra o Service
  Worker (`public/sw.js`) → `registration.pushManager.subscribe({ applicationServerKey:
  VAPID_PUBLIC_KEY })` → grava a inscrição via Server Action.

### 4. Disparo do push — ao criar um chamado
- Opção mais simples (v1): depois que `criar_chamado` (RPC, chamada pelo cliente anon)
  retorna sucesso, o próprio código do cardápio público chama uma **Route Handler**
  (`/api/chamados/notificar`, server-side, service role) que busca as inscrições de garçons
  ativos e envia via `web-push` para cada uma.
- Alternativa mais robusta (avaliar depois): trigger no Postgres + `pg_net` chamando essa
  mesma rota como webhook, pra não depender do cliente do salão "avisar" o backend.

### 5. Ações na notificação
```js
// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json(); // { mesa, chamadoId }
  event.waitUntil(self.registration.showNotification(`Mesa ${data.mesa} chamou`, {
    body: "Toque para aceitar",
    actions: [
      { action: "aceitar", title: "Aceitar" },
      { action: "ir", title: "Ir até a mesa" },
    ],
    data,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "aceitar") {
    event.waitUntil(
      fetch("/api/chamados/aceitar", {
        method: "POST",
        credentials: "include", // leva o cookie de sessão do garçom
        body: JSON.stringify({ chamadoId: event.notification.data.chamadoId }),
      })
    );
  } else {
    event.waitUntil(clients.openWindow("/fila"));
  }
});
```
- A Route Handler `/api/chamados/aceitar` valida `requireRole("garcom")` a partir do cookie
  e chama a RPC `aceitar_chamado` — mesma regra de aceite exclusivo do Módulo 3, sem
  duplicar lógica.
- "Ir até a mesa" não tem navegação física real (é um salão só) — funciona como confirmação
  visual/abre o app; não precisa de lógica de servidor própria.

## Checklist para quando voltarmos

- [ ] Confirmar com o Aquiles o aparelho predominante dos garçons (decide o quanto investir
      na experiência de iOS)
- [ ] Migration `push_inscricoes` + RLS
- [ ] Gerar e configurar chaves VAPID (`.env.example`/`.env.local`)
- [ ] Service worker + registro/opt-in em `/fila`
- [ ] Route Handler de disparo (`/api/chamados/notificar`) + de aceite via ação
      (`/api/chamados/aceitar`)
- [ ] Testar em Android real e em iPhone (com e sem "adicionar à tela de início")
- [ ] Alinhar com o cliente que é bônus, não item contratual, e a limitação de iOS
- [ ] Testar de verdade só depois do domínio real estar no ar (Fase 6/7)

Ver também: `00-contexto-e-escopo.md` (exclusão contratual e pendência de aparelho do
garçom), `02-notas-tecnicas.md` (nota de escopo do Módulo 3), `01-especificacao-funcional.md`
(Módulo 3 — comportamento correto a manter como base: notificação em tela/fila).
