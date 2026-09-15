-- Point07 — bônus (fora do contrato): push de notificação pro garçom.
-- Web Push padrão (RFC 8030): cada inscrição é o endpoint do navegador + chaves de
-- criptografia da mensagem. Escrita/leitura restrita ao dono; o disparo em massa
-- (Route Handler /api/chamados/notificar) usa o cliente service_role e ignora RLS.

create table public.push_inscricoes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth_key    text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

comment on table public.push_inscricoes is
  'Bônus não contratual: inscrições de Web Push por garçom, pra alertar chamados novos.';

create index push_inscricoes_usuario_idx on public.push_inscricoes (usuario_id);

alter table public.push_inscricoes enable row level security;

create policy "push_inscricoes_own_select"
  on public.push_inscricoes for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "push_inscricoes_own_insert"
  on public.push_inscricoes for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "push_inscricoes_own_update"
  on public.push_inscricoes for update
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "push_inscricoes_own_delete"
  on public.push_inscricoes for delete
  to authenticated
  using (usuario_id = (select auth.uid()));
