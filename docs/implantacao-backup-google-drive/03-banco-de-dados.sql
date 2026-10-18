-- ============================================================================
-- Migrations necessárias pro mecanismo de backup + autorização do Google.
-- Adaptar nomes de tabela/schema se o projeto alvo já tiver convenções
-- próprias. Pressupõe que já existe uma tabela `public.profiles` (ou
-- equivalente) referenciando `auth.users`, com uma função `is_admin()` ou
-- similar já estabelecida — ajuste as referências abaixo conforme o projeto.
-- Aplicar como 3 migrations separadas (nomeadas abaixo), nessa ordem.
-- ============================================================================


-- ============================================================================
-- Migration 1: terceiro nível de acesso ("admin interno" / quem desenvolve
-- a plataforma), separado do admin do cliente final.
-- ============================================================================

-- Flag adicional no perfil — só visível/alterável fora do fluxo normal da
-- aplicação. Troque "eh_admin_innovation" pelo nome que fizer sentido no
-- seu projeto (ex.: eh_admin_dev, eh_super_admin, etc.).
alter table public.profiles add column eh_admin_innovation boolean not null default false;

-- Trava no nível de COLUNA (não só RLS por linha): revoga o grant de UPDATE
-- amplo que a aplicação normalmente tem sobre profiles, e reconcede só nas
-- colunas que a aplicação de fato edita. A coluna do flag fica de fora —
-- nenhum usuário autenticado consegue setar isso em si mesmo, nem chamando a
-- API diretamente com a própria sessão. Ajuste a lista de colunas conforme
-- o que seu projeto realmente edita via UI.
revoke update on public.profiles from authenticated;
grant update (nome, email, role, status) on public.profiles to authenticated;

-- Função auxiliar, mesmo padrão de uma função is_admin() já existente no
-- projeto (se já existir uma, usa o mesmo estilo).
create function public.eh_admin_innovation()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select eh_admin_innovation from public.profiles where id = auth.uid()),
    false
  );
$$;

-- IMPORTANTE: pra marcar a primeira conta como admin interno, não existe
-- (de propósito) nenhuma tela pra isso — é feito uma vez, direto via SQL ou
-- com a service_role key:
--   update public.profiles set eh_admin_innovation = true where email = '<SEU_EMAIL>';


-- ============================================================================
-- Migration 2: histórico de backups — a rotina escreve, só o admin interno lê.
-- ============================================================================

create table public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'sucesso', 'erro')),
  drive_arquivo_id text,
  drive_arquivo_url text,
  tamanho_bytes bigint,
  mensagem_erro text,
  disparado_manualmente boolean not null default false
);
create index backup_logs_iniciado_em_idx on public.backup_logs (iniciado_em desc);

alter table public.backup_logs enable row level security;

create policy "Somente admin interno vê os backups" on public.backup_logs
  for select using (public.eh_admin_innovation());

-- Sem nenhuma policy de insert/update pra "authenticated" — só a rotina de
-- backup (via service_role, que ignora RLS) grava aqui. O app só lê.
grant select on public.backup_logs to authenticated;
grant all on public.backup_logs to service_role;


-- ============================================================================
-- Migration 3: integração do Google Drive — onde o refresh token fica.
-- ============================================================================

-- Singleton (sempre 1 linha só, id=true) — mesmo padrão de uma tabela de
-- configurações única que o projeto já tenha, se houver.
create table public.integracao_google_drive (
  id boolean primary key default true check (id),
  refresh_token text,
  atualizado_em timestamptz,
  atualizado_por uuid references public.profiles (id) on delete set null
);

insert into public.integracao_google_drive (id) values (true);

alter table public.integracao_google_drive enable row level security;

create policy "Somente admin interno vê a integração do Drive" on public.integracao_google_drive
  for select using (public.eh_admin_innovation());

create policy "Somente admin interno atualiza a integração do Drive" on public.integracao_google_drive
  for update using (public.eh_admin_innovation()) with check (public.eh_admin_innovation());

grant select, update on public.integracao_google_drive to authenticated;
grant all on public.integracao_google_drive to service_role;
