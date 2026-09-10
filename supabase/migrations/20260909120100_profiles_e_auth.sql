-- Point07 — Fase 1: usuários internos e perfis de acesso (Módulo 6)
-- Dois perfis: Administrador e Garçom. Login individual via Supabase Auth.
-- profiles é 1:1 com auth.users e guarda nome, perfil e status (ativo/inativo).

create type public.user_role as enum ('admin', 'garcom');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  email      text,
  role       public.user_role not null default 'garcom',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Usuários internos (Administrador, Garçom). 1:1 com auth.users. email é cópia de leitura de auth.users.';

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sincronização com o Auth
-- ---------------------------------------------------------------------------

-- Cria automaticamente o profile quando um usuário nasce no Auth.
-- nome e role vêm de raw_user_meta_data (definidos ao criar o usuário via Admin API);
-- se ausentes, cai em defaults seguros (nome = parte local do e-mail, role = garcom).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'garcom')::public.user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém profiles.email em dia se o e-mail mudar no Auth.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- ---------------------------------------------------------------------------
-- Helper de autorização
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER: roda como owner (postgres) e ignora RLS de profiles,
-- evitando recursão infinita nas policies que chamam is_admin().
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and ativo
  );
$$;

grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'True se o usuário autenticado é um Administrador ativo. Usada nas RLS policies.';

-- ---------------------------------------------------------------------------
-- RLS — Row Level Security (camada de defesa no banco, além da app)
-- ---------------------------------------------------------------------------

-- Leitura: cada um enxerga o próprio profile; o Administrador enxerga todos.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

-- Escrita: exclusiva do Administrador. A criação do login em si é feita via
-- Admin API (service_role, que ignora RLS); estas policies cobrem edições de
-- nome/role/ativo feitas pela aplicação.
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());
