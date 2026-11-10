-- Point07 — Módulo 3: QR universal. Um único QR (impresso uma vez) que leva o cliente
-- a ESCOLHER a mesa, para quando juntam mesas. Complementa os QRs por mesa, que seguem
-- iguais. O token abaixo é criado uma vez e NUNCA muda sozinho (o QR impresso vale
-- para sempre); o Administrador só liga/desliga.

create table public.qr_universal (
  id         smallint primary key default 1 check (id = 1),
  token      uuid not null default gen_random_uuid(),
  ativo      boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.qr_universal is
  'QR universal do cardápio (cliente escolhe a mesa) — singleton, sempre id=1. Não há RPC/UI para trocar o token.';

insert into public.qr_universal (id) values (1);

alter table public.qr_universal enable row level security;

create trigger qr_universal_set_updated_at
  before update on public.qr_universal
  for each row execute function public.set_updated_at();

create trigger qr_universal_auditoria
  after insert or update or delete on public.qr_universal
  for each row execute function public.registrar_auditoria();

-- Só Admin/Gerente enxergam e ligam/desligam. Sem insert/delete (linha fixa) e
-- sem acesso anon: o cliente só chega a esses dados pelas RPCs abaixo.
create policy "qr_universal_select_admin"
  on public.qr_universal for select
  to authenticated
  using (public.is_admin());

create policy "qr_universal_update_admin"
  on public.qr_universal for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPCs — cliente do salão (anon)
-- ---------------------------------------------------------------------------

-- Lista (só os nomes) das mesas ativas, se o token universal é válido e está ativo.
-- Vazio = QR inválido ou desativado. NUNCA devolve qr_token de mesa.
create or replace function public.mesas_por_qr_universal(p_token uuid)
returns table (id uuid, identificador text)
language sql
security definer
set search_path = ''
stable
as $$
  select m.id, m.identificador
  from public.mesas m
  where m.ativo
    and exists (
      select 1 from public.qr_universal q
      where q.id = 1 and q.ativo and q.token = p_token
    )
  order by m.identificador;
$$;

grant execute on function public.mesas_por_qr_universal(uuid) to anon, authenticated;

-- Devolve o qr_token da UMA mesa escolhida (para seguir o fluxo normal /mesa/<token>).
-- Null se o token universal é inválido/desativado ou a mesa não existe/está inativa.
create or replace function public.mesa_token_por_qr_universal(p_token uuid, p_mesa_id uuid)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select m.qr_token
  from public.mesas m
  where m.id = p_mesa_id
    and m.ativo
    and exists (
      select 1 from public.qr_universal q
      where q.id = 1 and q.ativo and q.token = p_token
    );
$$;

grant execute on function public.mesa_token_por_qr_universal(uuid, uuid) to anon, authenticated;
