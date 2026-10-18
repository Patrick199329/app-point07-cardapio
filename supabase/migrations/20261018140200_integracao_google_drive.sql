-- Integração com o Google Drive — onde o refresh token OAuth fica (não num
-- secret fixo do GitHub, pra o botão "Autorizar Google Drive" no painel
-- conseguir renovar sozinho). Ver docs/implantacao-backup-google-drive/.

create table public.integracao_google_drive (
  id             boolean primary key default true check (id),
  refresh_token  text,
  atualizado_em  timestamptz,
  atualizado_por uuid references public.profiles (id) on delete set null
);

comment on table public.integracao_google_drive is
  'Singleton (1 linha, id=true) com o refresh token OAuth do Google Drive usado pela rotina de backup.';

insert into public.integracao_google_drive (id) values (true);

alter table public.integracao_google_drive enable row level security;

create policy "Somente admin interno vê a integração do Drive" on public.integracao_google_drive
  for select
  to authenticated
  using (public.eh_admin_innovation());

create policy "Somente admin interno atualiza a integração do Drive" on public.integracao_google_drive
  for update
  to authenticated
  using (public.eh_admin_innovation())
  with check (public.eh_admin_innovation());

grant select, update on public.integracao_google_drive to authenticated;
grant all on public.integracao_google_drive to service_role;
