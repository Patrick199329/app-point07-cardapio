@AGENTS.md

# Point07

Plataforma web para o bar/restaurante Point07 (cliente da Innovation Consultoria).
Dois grandes blocos: **cardápio digital** e **atendimento de salão** (chamada de garçom
em tempo real). Documentação de escopo em `docs/`.

## Stack

- **Next.js 16** (App Router, TS, Turbopack) — atenção às breaking changes vs. Next 15:
  `middleware.ts` virou `src/proxy.ts` (função `proxy`, runtime nodejs); `cookies()`/
  `headers()` são async; `next lint` não existe mais (`npm run lint` chama o ESLint CLI).
  Consulte `node_modules/next/dist/docs/` antes de usar APIs do framework.
- **Supabase local** via CLI (`npm run db:*`). Portas dedicadas **555xx** (ver
  `supabase/config.toml`) — NÃO usar as portas padrão 543xx.
- **shadcn/ui** estilo `base-nova` sobre **Base UI** (`@base-ui/react`), não Radix.
  `asChild` não existe — use a prop `render={<Elemento />}`. `cn` vem de `"cn"`
  (reexportado em `@/lib/utils`).
- Tailwind v4, sonner para toasts.

## Regras do ambiente (críticas)

- O Docker e a conta Supabase do usuário hospedam **outros projetos**. NUNCA rodar
  `docker stop/rm/prune`, `supabase link`, `supabase db push/pull` ou qualquer coisa que
  toque em algo fora do Point07. Gerenciar o stack só via `npm run db:start|stop|status`.
- Todo o desenvolvimento das Fases 1–5 é **local**. Nuvem (Supabase Cloud + Vercel) só na Fase 6.
- Nenhum segredo versionado. `.env.local` e chaves ficam fora do git.

## Banco

- Schema é definido por migrations em `supabase/migrations/` (fonte de verdade).
- Após mudar o schema: `npm run db:reset` e depois `npm run db:types` para regenerar
  `src/lib/types/database.ts`.
- RLS ativo em todas as tabelas. `public.is_admin()` / `public.is_garcom()` (SECURITY
  DEFINER) são os helpers de autorização usados nas policies. Perfis: `admin`, `gerente`,
  `garcom` — `gerente` tem o mesmo nível de acesso do `admin` (decisão do cliente;
  `is_admin()` retorna true pros dois, é o único helper usado em todas as policies do
  projeto, então não precisa duplicar regra por tabela).
- Escritas que envolvem o **cliente do salão sem login** (Módulo 3) passam por **RPCs
  SECURITY DEFINER** (`mesa_por_token`, `criar_chamado`, `status_chamado`,
  `cancelar_chamado`, `aceitar_chamado` — migration `20260910120000_chamados.sql`), nunca
  por policy de INSERT/UPDATE direta em `chamados`. O aceite exclusivo (`aceitar_chamado`)
  é um único `UPDATE ... WHERE status='pendente'` — a atomicidade vem do banco, não de
  lógica na aplicação.
- Ciclo do atendimento: `pendente → aceito → finalizado` (`aceito` = "Em atendimento" na
  UI). `finalizar_chamado` (só quem atende, ou admin/gerente) e
  `finalizar_chamados_expirados` (tempo máximo em `fila_config.atendimento_max_minutos`,
  padrão 10 min; sem pg_cron — a fila chama a cada 30s). Índice parcial único garante 1
  atendimento `aceito` por garçom; quem está em atendimento não recebe push. Finalização
  automática (`finalizado_auto`) fica fora das médias de duração. Migrations
  `20261026120000`/`20261026120100`.
- `chamados` está na publication `supabase_realtime` — a fila do garçom (`/fila`) assina
  `postgres_changes` com o cliente autenticado; a RLS de SELECT (`is_admin() or
  is_garcom()`) também vale para o que o Realtime entrega.

## Autorização na aplicação

- `src/proxy.ts` → refresh de sessão + barra rotas protegidas de quem não está logado.
  `/cardapio`, `/mesa` e `/auth` são públicos (cliente do salão, sem login).
- `src/lib/auth.ts` → `requireRole(role)` / `requireAnyRole(roles[])` nos layouts fazem o
  controle fino. `/painel/*` aceita `admin` e `gerente`; `/fila` aceita os três perfis.
- Server Actions sempre revalidam o perfil (`requireRole`/`requireAnyRole`) — não confiar
  só no proxy.
- O widget "chamar garçom" e a fila do garçom chamam as RPCs **direto do navegador**
  (`@/lib/supabase/client`), sem Server Action — a autorização vive inteira no banco
  (RLS + SECURITY DEFINER), então isso é seguro.

## Estrutura

- `/login` — acesso da equipe
- `/painel/*` — área do Administrador (e Gerente, mesmo nível de acesso): usuários, mesas
  (+ `mesas/impressao` — gera os QR para imprimir), cardápio, eventos, painel gerencial
  (`/painel/gerencial` — KPIs e gráficos de atendimento por garçom/dia/mesa, a partir do
  Registro de Eventos)
- `/cardapio` — cardápio público; `/mesa/[token]` — idem, com contexto da mesa (QR)
- `/fila` — fila de chamados em tempo real (Garçom; Administrador e Gerente também
  atendem, por isso também acessam essa rota)

## QR das mesas

- `mesas.qr_token` (UUID, gerado no cadastro) é a base do QR — nunca expor em massa para
  `anon` fora do necessário.
- `NEXT_PUBLIC_SITE_URL` define a URL codificada no QR (`<base>/mesa/<qr_token>`). Em dev é
  `http://localhost:3000`; o domínio real do cliente entra nas Fases 6/7 — até lá,
  `/painel/mesas/impressao` mostra um aviso de que a base ainda é local.
- Geração é interna (`qrcode` + `sharp`, sem serviço externo) — `src/lib/qr.ts`.

## Padrão de engenharia

`docs/Padrao-de-Engenharia-e-Seguranca.md` é o checklist do projeto (PRD por módulo, UML,
feature flags, RBAC, RLS, testes, error reporting, auditoria de deploy, WAF, HTTPS).
Testes automatizados e alguns itens foram adiados por decisão do cliente nesta 1ª leva —
retomar antes do deploy.
