-- Point07 — Fase 3: Chamada de Garçom (Módulo 3) + Registro de Eventos (Módulo 4)
-- A tabela `chamados` É o registro de eventos: todo chamado fica gravado, mesmo que
-- nunca aceito (fica 'pendente') ou cancelado. Nada é apagado.

create type public.chamado_status as enum ('pendente', 'aceito', 'cancelado');

create table public.chamados (
  id           uuid primary key default gen_random_uuid(),
  mesa_id      uuid not null references public.mesas (id) on delete restrict,
  status       public.chamado_status not null default 'pendente',
  criado_em    timestamptz not null default now(),
  aceito_em    timestamptz,
  cancelado_em timestamptz,
  garcom_id    uuid references public.profiles (id) on delete set null,
  -- Identifica o "dono" do chamado no aparelho do cliente do salão (sem login),
  -- para que só ele possa consultar o status e cancelar.
  origem_token uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint chamados_aceito_consistente check (
    status <> 'aceito' or (aceito_em is not null and garcom_id is not null)
  ),
  constraint chamados_cancelado_consistente check (
    status <> 'cancelado' or cancelado_em is not null
  )
);

comment on table public.chamados is
  'Módulos 3 e 4: cada acionamento de "chamar garçom" por mesa. Fonte do histórico e das métricas.';

create index chamados_status_criado_idx on public.chamados (status, criado_em);
create index chamados_mesa_criado_idx on public.chamados (mesa_id, criado_em desc);
create index chamados_garcom_idx on public.chamados (garcom_id, aceito_em desc);

alter table public.chamados enable row level security;

create trigger chamados_set_updated_at
  before update on public.chamados
  for each row execute function public.set_updated_at();

-- Fila em tempo real para os garçons (Realtime respeita a RLS abaixo).
alter publication supabase_realtime add table public.chamados;

-- ---------------------------------------------------------------------------
-- Helper de autorização (espelho de public.is_admin())
-- ---------------------------------------------------------------------------
create or replace function public.is_garcom()
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
      and role = 'garcom'
      and ativo
  );
$$;

grant execute on function public.is_garcom() to authenticated;

comment on function public.is_garcom() is
  'True se o usuário autenticado é um Garçom ativo. Usada nas RLS policies e RPCs do salão.';

-- ---------------------------------------------------------------------------
-- RLS: leitura só para equipe interna. Escrita SÓ pelas RPCs (SECURITY DEFINER).
-- ---------------------------------------------------------------------------
create policy "chamados_select_equipe"
  on public.chamados for select
  to authenticated
  using (public.is_admin() or public.is_garcom());

-- ---------------------------------------------------------------------------
-- RPCs — cliente do salão (anon)
-- ---------------------------------------------------------------------------

-- Resolve o QR da mesa. Retorna null se a mesa não existe ou está inativa.
create or replace function public.mesa_por_token(p_token uuid)
returns table (id uuid, identificador text)
language sql
security definer
set search_path = ''
stable
as $$
  select m.id, m.identificador
  from public.mesas m
  where m.qr_token = p_token and m.ativo;
$$;

grant execute on function public.mesa_por_token(uuid) to anon, authenticated;

-- Cria um chamado para a mesa do token. Dedup: se já existe um 'pendente' para a
-- mesma mesa nos últimos 90s, devolve esse (evita toque duplo e spam básico).
create or replace function public.criar_chamado(p_token uuid)
returns table (chamado_id uuid, origem_token uuid, status public.chamado_status, ja_existia boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mesa_id uuid;
  v_existente public.chamados%rowtype;
  v_novo public.chamados%rowtype;
begin
  select m.id into v_mesa_id
  from public.mesas m
  where m.qr_token = p_token and m.ativo;

  if v_mesa_id is null then
    raise exception 'mesa_invalida' using errcode = 'P0001';
  end if;

  select * into v_existente
  from public.chamados c
  where c.mesa_id = v_mesa_id
    and c.status = 'pendente'
    and c.criado_em > now() - interval '90 seconds'
  order by c.criado_em desc
  limit 1;

  if found then
    return query select v_existente.id, v_existente.origem_token, v_existente.status, true;
    return;
  end if;

  insert into public.chamados (mesa_id)
  values (v_mesa_id)
  returning * into v_novo;

  return query select v_novo.id, v_novo.origem_token, v_novo.status, false;
end;
$$;

grant execute on function public.criar_chamado(uuid) to anon, authenticated;

-- Status do próprio chamado (exige o origem_token que só o dono tem).
create or replace function public.status_chamado(p_id uuid, p_origem_token uuid)
returns table (status public.chamado_status, garcom_nome text, aceito_em timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select c.status, p.nome, c.aceito_em
  from public.chamados c
  left join public.profiles p on p.id = c.garcom_id
  where c.id = p_id and c.origem_token = p_origem_token;
$$;

grant execute on function public.status_chamado(uuid, uuid) to anon, authenticated;

-- Cliente cancela o próprio chamado enquanto pendente.
create or replace function public.cancelar_chamado(p_id uuid, p_origem_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_afetados integer;
begin
  update public.chamados
  set status = 'cancelado', cancelado_em = now()
  where id = p_id
    and origem_token = p_origem_token
    and status = 'pendente';
  get diagnostics v_afetados = row_count;
  return v_afetados > 0;
end;
$$;

grant execute on function public.cancelar_chamado(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC — garçom: aceite EXCLUSIVO e atômico
-- ---------------------------------------------------------------------------
create or replace function public.aceitar_chamado(p_id uuid)
returns table (ok boolean, motivo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_afetados integer;
begin
  if not (public.is_admin() or public.is_garcom()) then
    return query select false, 'sem_permissao';
    return;
  end if;

  update public.chamados
  set status = 'aceito',
      garcom_id = (select auth.uid()),
      aceito_em = now()
  where id = p_id
    and status = 'pendente';
  get diagnostics v_afetados = row_count;

  if v_afetados = 0 then
    return query select false, 'ja_aceito';
  else
    return query select true, null::text;
  end if;
end;
$$;

grant execute on function public.aceitar_chamado(uuid) to authenticated;
