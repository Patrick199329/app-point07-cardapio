-- Logs de auditoria — terceiro nível de admin (Innovation), mesmo padrão de
-- acesso de backup_logs/integracao_google_drive. Tela em /painel/logs.

create type public.auditoria_tipo as enum ('criacao', 'edicao', 'exclusao', 'entrada', 'saida');

create table public.logs_auditoria (
  id          uuid primary key default gen_random_uuid(),
  criado_em   timestamptz not null default now(),
  usuario_id  uuid references public.profiles (id) on delete set null,
  tipo        public.auditoria_tipo not null,
  tabela      text,
  registro_id text,
  antes       jsonb,
  depois      jsonb
);

comment on table public.logs_auditoria is
  'Auditoria de ações da equipe (criação/edição/exclusão em dados + login/logout). Só visível pra quem tem eh_admin_innovation.';

create index logs_auditoria_criado_em_idx on public.logs_auditoria (criado_em desc);

alter table public.logs_auditoria enable row level security;

create policy "Somente admin interno vê os logs de auditoria" on public.logs_auditoria
  for select
  to authenticated
  using (public.eh_admin_innovation());

-- Sem policy de insert pra "authenticated" — só o trigger/RPC abaixo (ambos
-- security definer) ou service_role gravam aqui.
grant select on public.logs_auditoria to authenticated;
grant all on public.logs_auditoria to service_role;

-- ---------------------------------------------------------------------------
-- Trigger genérico — anexado por tabela na migration seguinte. Não precisa
-- de lógica por tabela: tg_table_name/to_jsonb(old)/to_jsonb(new) cobrem
-- qualquer tabela.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.logs_auditoria (usuario_id, tipo, tabela, registro_id, antes, depois)
  values (
    (select auth.uid()),
    case tg_op
      when 'INSERT' then 'criacao'
      when 'UPDATE' then 'edicao'
      when 'DELETE' then 'exclusao'
    end::public.auditoria_tipo,
    tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

comment on function public.registrar_auditoria() is
  'Trigger genérico de auditoria — anexar AFTER INSERT OR UPDATE OR DELETE em qualquer tabela com coluna id. Grava em public.logs_auditoria.';

-- ---------------------------------------------------------------------------
-- RPC pros casos que não são mudança de linha numa tabela rastreada (login/
-- logout) ou que passam pela Admin API do Supabase, fora do contexto de
-- auth.uid() (criação de usuário, redefinição de senha — ver
-- src/app/painel/usuarios/actions.ts). Sempre usa auth.uid() internamente
-- pro autor, nunca confia em id vindo do client.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_auditoria_manual(
  p_tipo public.auditoria_tipo,
  p_tabela text default null,
  p_registro_id text default null,
  p_antes jsonb default null,
  p_depois jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.logs_auditoria (usuario_id, tipo, tabela, registro_id, antes, depois)
  values ((select auth.uid()), p_tipo, p_tabela, p_registro_id, p_antes, p_depois);
$$;

grant execute on function public.registrar_auditoria_manual(public.auditoria_tipo, text, text, jsonb, jsonb) to authenticated;

comment on function public.registrar_auditoria_manual is
  'Registro manual de auditoria (login/logout, criação de usuário, redefinição de senha) — usada quando não há trigger de tabela aplicável. auth.uid() é sempre o autor, não confia em valor vindo do client.';
