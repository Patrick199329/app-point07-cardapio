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
- RLS ativo em todas as tabelas. `public.is_admin()` (SECURITY DEFINER) é o helper de
  autorização usado nas policies. Perfis: `admin`, `garcom`.

## Autorização na aplicação

- `src/proxy.ts` → refresh de sessão + barra rotas protegidas de quem não está logado.
- `src/lib/auth.ts` → `requireRole('admin' | 'garcom')` nos layouts faz o controle fino.
- Server Actions sempre revalidam o perfil (`requireRole`) — não confiar só no proxy.

## Estrutura

- `/login` — acesso da equipe
- `/painel/*` — área do Administrador (usuários, mesas; cardápio/gerencial/eventos nas próximas fases)
- `/fila` — área do Garçom (placeholder até a Fase 2)

## Padrão de engenharia

`docs/Padrao-de-Engenharia-e-Seguranca.md` é o checklist do projeto (PRD por módulo, UML,
feature flags, RBAC, RLS, testes, error reporting, auditoria de deploy, WAF, HTTPS).
Testes automatizados e alguns itens foram adiados por decisão do cliente nesta 1ª leva —
retomar antes do deploy.
