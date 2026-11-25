-- Point07 — Módulo 3: chave para ligar/desligar a chamada de garçom pelo cardápio.
-- Desligada: o botão some do cardápio E o banco recusa novos chamados (criar_chamado),
-- então uma página já aberta no celular do cliente também não consegue chamar.
-- Chamados que já estão na fila continuam normalmente. Padrão: ligada (como era).

alter table public.fila_config
  add column if not exists chamada_garcom_ativa boolean not null default true;

comment on column public.fila_config.chamada_garcom_ativa is
  'Quando false, o botão "Chamar garçom" some do cardápio e criar_chamado() recusa novos chamados.';

-- A fila_config só é legível para a equipe (authenticated); o cardápio público
-- (anon) pergunta por esta função, que expõe SÓ este booleano.
create or replace function public.chamada_garcom_ativa()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce((select f.chamada_garcom_ativa from public.fila_config f where f.id = 1), true);
$$;

grant execute on function public.chamada_garcom_ativa() to anon, authenticated;

-- criar_chamado: igual à versão anterior (20261026130000), mais a recusa quando desligada.
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
  v_intervalo integer;
  v_ultimo_aceite timestamptz;
  v_restante integer;
begin
  select m.id into v_mesa_id
  from public.mesas m
  where m.qr_token = p_token and m.ativo;

  if v_mesa_id is null then
    raise exception 'mesa_invalida' using errcode = 'P0001';
  end if;

  if not public.chamada_garcom_ativa() then
    raise exception 'chamada_desativada' using errcode = 'P0001';
  end if;

  -- Dedup: já existe um 'pendente' desta mesa nos últimos 90s — devolve esse.
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

  -- Intervalo mínimo desde o último aceite desta mesa.
  select coalesce(intervalo_novo_chamado_segundos, 60) into v_intervalo
  from public.fila_config where id = 1;

  select max(c.aceito_em) into v_ultimo_aceite
  from public.chamados c
  where c.mesa_id = v_mesa_id
    and c.aceito_em is not null;

  if v_ultimo_aceite is not null
     and v_ultimo_aceite > now() - make_interval(secs => v_intervalo) then
    v_restante := ceil(extract(epoch from (v_ultimo_aceite + make_interval(secs => v_intervalo) - now())))::integer;
    -- A UI lê os segundos restantes em `hint`.
    raise exception 'chamado_recente' using errcode = 'P0001', hint = v_restante::text;
  end if;

  insert into public.chamados (mesa_id)
  values (v_mesa_id)
  returning * into v_novo;

  return query select v_novo.id, v_novo.origem_token, v_novo.status, false;
end;
$$;

grant execute on function public.criar_chamado(uuid) to anon, authenticated;
