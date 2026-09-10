-- Point07 — Fase 1: estrutura de dados de mesas
-- Base para o Módulo 3 (QR por mesa) e o Módulo 4 (registro de eventos por mesa).
-- Nesta fase só o cadastro. A geração da imagem do QR e o acesso público (anon)
-- entram na Fase 2 junto com o Cardápio Público / Chamada de Garçom.

create type public.mesa_area as enum ('interna', 'externa');

create table public.mesas (
  id            uuid primary key default gen_random_uuid(),
  identificador text not null unique,
  apelido       text,
  area          public.mesa_area not null default 'interna',
  ativo         boolean not null default true,
  qr_token      uuid not null unique default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.mesas is
  'Mesas do salão. qr_token é o identificador opaco usado no QR code por mesa (Módulo 3).';
comment on column public.mesas.identificador is
  'Rótulo único e visível da mesa (ex.: "Mesa 12", "Externa 3").';

alter table public.mesas enable row level security;

create trigger mesas_set_updated_at
  before update on public.mesas
  for each row execute function public.set_updated_at();

create index mesas_ativo_idx on public.mesas (ativo);

-- Leitura: qualquer usuário interno autenticado (Administrador e Garçom).
create policy "mesas_select_authenticated"
  on public.mesas for select
  to authenticated
  using (true);

-- Escrita: exclusiva do Administrador.
create policy "mesas_insert_admin"
  on public.mesas for insert
  to authenticated
  with check (public.is_admin());

create policy "mesas_update_admin"
  on public.mesas for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "mesas_delete_admin"
  on public.mesas for delete
  to authenticated
  using (public.is_admin());

-- ⚠️ Fase 2: adicionar acesso de leitura para `anon` (cliente do salão via QR),
-- restrito às colunas não sensíveis ou via RPC por qr_token — NÃO expor qr_token
-- em massa para anon.
