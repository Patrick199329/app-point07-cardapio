-- Point07 — Configuração da fila do garçom (Módulo 3): tempo limite antes de
-- um chamado pendente ser destacado (cartão em vermelho) na tela do garçom.
-- Singleton, mesmo padrão de sistema_config/cardapio_config.

create table public.fila_config (
  id                     smallint primary key default 1 check (id = 1),
  alerta_atraso_segundos integer not null default 300 check (alerta_atraso_segundos > 0),
  updated_at             timestamptz not null default now()
);

comment on table public.fila_config is
  'Configuração da fila de chamados (Módulo 3) — singleton, sempre id=1.';
comment on column public.fila_config.alerta_atraso_segundos is
  'Tempo (em segundos) que um chamado pendente pode esperar antes do cartão ficar em destaque (vermelho) na tela do garçom.';

insert into public.fila_config (id) values (1);

alter table public.fila_config enable row level security;

create trigger fila_config_set_updated_at
  before update on public.fila_config
  for each row execute function public.set_updated_at();

-- Leitura: só usuários autenticados (garçom/admin) — a fila não é pública.
create policy "fila_config_select_authenticated"
  on public.fila_config for select
  to authenticated
  using (true);

-- Escrita só do Administrador. Sem insert/delete — linha fixa (id=1).
create policy "fila_config_update_admin"
  on public.fila_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
