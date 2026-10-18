-- Histórico de backups — a rotina (GitHub Actions, via service_role) grava,
-- só o admin interno (Innovation) lê. Ver docs/implantacao-backup-google-drive/.

create table public.backup_logs (
  id                    uuid primary key default gen_random_uuid(),
  iniciado_em           timestamptz not null default now(),
  concluido_em          timestamptz,
  status                text not null default 'em_andamento' check (status in ('em_andamento', 'sucesso', 'erro')),
  drive_arquivo_id      text,
  drive_arquivo_url     text,
  tamanho_bytes         bigint,
  mensagem_erro         text,
  disparado_manualmente boolean not null default false
);

comment on table public.backup_logs is
  'Histórico de execuções do backup diário (Google Drive) — só gravado pela rotina em GitHub Actions, via service_role.';

create index backup_logs_iniciado_em_idx on public.backup_logs (iniciado_em desc);

alter table public.backup_logs enable row level security;

create policy "Somente admin interno vê os backups" on public.backup_logs
  for select
  to authenticated
  using (public.eh_admin_innovation());

-- Sem nenhuma policy de insert/update pra "authenticated" — só a rotina de
-- backup (via service_role, que ignora RLS) grava aqui. O app só lê.
grant select on public.backup_logs to authenticated;
grant all on public.backup_logs to service_role;
