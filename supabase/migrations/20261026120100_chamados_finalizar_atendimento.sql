-- Point07 — Módulo 3: finalizar atendimento, trava de 1 atendimento por garçom e
-- finalização automática por tempo (configurável pelo Administrador).
-- A mudança de status continua na MESMA linha de `chamados` (Registro de Eventos).

-- ---------------------------------------------------------------------------
-- Colunas e constraints
-- ---------------------------------------------------------------------------
alter table public.chamados
  add column finalizado_em   timestamptz,
  add column finalizado_auto boolean not null default false;

comment on column public.chamados.finalizado_em is
  'Quando o atendimento foi finalizado (pelo garçom, por Admin/Gerente ou automaticamente).';
comment on column public.chamados.finalizado_auto is
  'True se a finalização foi automática (tempo máximo excedido). Fica fora das médias de tempo de atendimento.';

alter table public.chamados
  add constraint chamados_finalizado_consistente check (
    status <> 'finalizado'
    or (aceito_em is not null and garcom_id is not null and finalizado_em is not null)
  );

-- Garantia no banco: um garçom só tem UM atendimento em andamento por vez.
create unique index chamados_um_atendimento_por_garcom_idx
  on public.chamados (garcom_id)
  where status = 'aceito';

create index chamados_finalizado_idx on public.chamados (garcom_id, finalizado_em desc);

-- ---------------------------------------------------------------------------
-- Configuração: tempo máximo de um atendimento (padrão 10 min)
-- ---------------------------------------------------------------------------
alter table public.fila_config
  add column atendimento_max_minutos integer not null default 10
    check (atendimento_max_minutos > 0);

comment on column public.fila_config.atendimento_max_minutos is
  'Tempo máximo (minutos) de um atendimento em andamento. Passou disso, é finalizado automaticamente.';

-- ---------------------------------------------------------------------------
-- Finalização automática (sem pg_cron: chamada pela fila, pelo aceite e pelo painel)
-- ---------------------------------------------------------------------------
create or replace function public.finalizar_chamados_expirados()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_afetados integer;
  v_max integer;
begin
  if not (public.is_admin() or public.is_garcom()) then
    return 0;
  end if;

  select atendimento_max_minutos into v_max from public.fila_config where id = 1;

  update public.chamados
  set status = 'finalizado',
      finalizado_em = now(),
      finalizado_auto = true
  where status = 'aceito'
    and aceito_em < now() - make_interval(mins => coalesce(v_max, 10));
  get diagnostics v_afetados = row_count;
  return v_afetados;
end;
$$;

grant execute on function public.finalizar_chamados_expirados() to authenticated;

-- ---------------------------------------------------------------------------
-- aceitar_chamado: agora recusa quem já está em atendimento
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

  perform public.finalizar_chamados_expirados();

  begin
    update public.chamados
    set status = 'aceito',
        garcom_id = (select auth.uid()),
        aceito_em = now()
    where id = p_id
      and status = 'pendente';
    get diagnostics v_afetados = row_count;
  exception when unique_violation then
    -- índice parcial: já existe um atendimento 'aceito' deste garçom
    return query select false, 'em_atendimento';
    return;
  end;

  if v_afetados = 0 then
    return query select false, 'ja_aceito';
  else
    return query select true, null::text;
  end if;
end;
$$;

grant execute on function public.aceitar_chamado(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- finalizar_chamado: só quem atende (ou Admin/Gerente) finaliza
-- ---------------------------------------------------------------------------
create or replace function public.finalizar_chamado(p_id uuid)
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
  set status = 'finalizado',
      finalizado_em = now(),
      finalizado_auto = false
  where id = p_id
    and status = 'aceito'
    and (garcom_id = (select auth.uid()) or public.is_admin());
  get diagnostics v_afetados = row_count;

  if v_afetados = 0 then
    return query select false, 'nao_esta_em_atendimento';
  else
    return query select true, null::text;
  end if;
end;
$$;

grant execute on function public.finalizar_chamado(uuid) to authenticated;
