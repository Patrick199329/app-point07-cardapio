-- Point07 — Módulo 3: intervalo mínimo para a mesa chamar o garçom de novo.
-- Depois que um garçom ACEITA o chamado, a mesa só pode chamar outra vez após
-- `fila_config.intervalo_novo_chamado_segundos` (padrão 60s). A regra vive no banco
-- (criar_chamado), então recarregar a página ou reescanear o QR não burla.

alter table public.fila_config
  add column if not exists intervalo_novo_chamado_segundos integer not null default 60
    check (intervalo_novo_chamado_segundos >= 0);

comment on column public.fila_config.intervalo_novo_chamado_segundos is
  'Segundos que a mesa precisa esperar, depois do aceite de um chamado, para chamar o garçom de novo.';

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
