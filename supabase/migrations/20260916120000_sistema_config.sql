-- Point07 — Identidade do sistema: logo usada na tela de login e "de dentro
-- do sistema" (menu do admin, cabeçalho do garçom). Singleton, mesmo padrão
-- de cardapio_config (migration 20260914120000).

create table public.sistema_config (
  id         smallint primary key default 1 check (id = 1),
  logo_path  text,
  updated_at timestamptz not null default now()
);

comment on table public.sistema_config is
  'Identidade visual interna (login, painel, fila do garçom) — singleton, sempre id=1. Separado de cardapio_config, que é a aparência do cardápio público.';

insert into public.sistema_config (id) values (1);

alter table public.sistema_config enable row level security;

create trigger sistema_config_set_updated_at
  before update on public.sistema_config
  for each row execute function public.set_updated_at();

-- Leitura pública: /login precisa ler a logo sem sessão.
create policy "sistema_config_select_all"
  on public.sistema_config for select
  to anon, authenticated
  using (true);

-- Escrita só do Administrador. Sem insert/delete — linha fixa (id=1).
create policy "sistema_config_update_admin"
  on public.sistema_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
