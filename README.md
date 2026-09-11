# Point07

Plataforma web do bar/restaurante **Point07** — cardápio digital + atendimento de salão
(chamada de garçom em tempo real). Projeto da Innovation Consultoria.

Documentação de escopo, especificação funcional, notas técnicas, backlog e cronograma em
[`docs/`](docs/). Padrão de engenharia e segurança em
[`docs/Padrao-de-Engenharia-e-Seguranca.md`](docs/Padrao-de-Engenharia-e-Seguranca.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend / SSR | Next.js 16 (App Router, TypeScript, Turbopack) |
| UI | Tailwind CSS v4 + shadcn/ui (estilo `base-nova`, sobre Base UI) |
| Banco / Auth / Realtime | Supabase (Postgres 17) — **local** via CLI nas Fases 1–5 |
| Deploy (Fase 6) | Supabase Cloud + Vercel |

## Pré-requisitos

- Node.js 20.9+ (testado com Node 24)
- Docker Desktop **em execução** (necessário para o Supabase local)
- npm

## Como rodar o ambiente local

```bash
npm install

# 1. Sobe o Supabase local (Postgres, Auth, Realtime, Studio) — precisa do Docker aberto
npm run db:start

# 2. Copie as chaves impressas para o .env.local
cp .env.example .env.local
#   NEXT_PUBLIC_SITE_URL       = base dos QR das mesas (http://localhost:3000 em dev;
#                                 o domínio real do cliente entra na Fase 6/7)
#   NEXT_PUBLIC_SUPABASE_URL   = API URL              (http://127.0.0.1:55521)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY   = anon key
#   SUPABASE_SERVICE_ROLE_KEY  = service_role key     (npm run db:status mostra de novo)

# 3. Aplica migrations + seed
npm run db:reset

# 4. (Opcional) regenera os tipos do banco
npm run db:types

# 5. App
npm run dev            # http://localhost:3000
```

Portas do Supabase local do Point07 (dedicadas, para não colidir com outros projetos):

| Serviço | Porta |
|---|---|
| API | 55521 |
| Postgres | 55522 |
| Studio | http://127.0.0.1:55523 |
| Inbucket (e-mails de teste) | http://127.0.0.1:55524 |

`npm run db:stop` encerra o stack (só os containers do Point07).

## Usuários de desenvolvimento (seed)

> ⚠️ Dados de exemplo — o número real de mesas e de usuários será confirmado com o cliente.
> Senha padrão: `point07dev`.

| E-mail | Perfil |
|---|---|
| `admin@point07.local` | Administrador |
| `joao@point07.local` | Garçom |
| `maria@point07.local` | Garçom |

## Estado atual

Implementado (Fases 1–3 do desenvolvimento local):

- Autenticação com login individual e dois perfis (**Administrador**, **Garçom**), rotas
  protegidas por perfil (`src/proxy.ts` + `src/lib/auth.ts`)
- **Painel do Administrador** (`/painel`): usuários, mesas, cardápio (categorias/produtos/
  avisos), eventos, geração de QR para impressão — tudo mobile-first (nav em drawer no
  celular)
- **Cardápio Público** (`/cardapio` e `/mesa/[token]`): mobile-first, sem login, reflete o
  painel sem publicação manual
- **Chamada de Garçom** (Módulo 3): QR por mesa, botão "Chamar garçom" no cardápio (RPCs
  `criar_chamado`/`status_chamado`/`cancelar_chamado`, com dedup de 90s), fila do garçom em
  **`/fila`** com Supabase Realtime e aceite exclusivo (`aceitar_chamado`, atômico)
- **Registro de Eventos** (Módulo 4): histórico em `/painel/eventos` com filtros
- **Gerador de QR** (`/painel/mesas/impressao`): cartão por mesa no estilo Point07 (logo,
  QR, tagline), pronto para imprimir em A4
- Schema com RLS em todas as tabelas (`profiles`, `mesas`, `categorias`, `produtos`,
  `avisos`, `chamados`) + funções `SECURITY DEFINER` (`is_admin`, `is_garcom` e as RPCs do
  Módulo 3)

Próximo (ver [`docs/03-backlog-de-tarefas.md`](docs/03-backlog-de-tarefas.md)): **Painel
Gerencial** (Módulo 5 — métricas de atendimento), migração do cardápio atual do WordPress,
domínio real no QR (Fase 6/7).

Itens do padrão de engenharia adiados: testes automatizados (Vitest/Playwright), botão de
reportar erro, feature flags, diagramas UML. Retomar antes do deploy.

## Scripts

| Script | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e execução de produção |
| `npm run lint` | ESLint |
| `npm run db:start` / `db:stop` / `db:status` | Supabase local |
| `npm run db:reset` | Recria o banco local (migrations + seed) |
| `npm run db:types` | Regenera `src/lib/types/database.ts` a partir do banco local |
