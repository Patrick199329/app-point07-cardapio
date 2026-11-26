-- Selos de produto no cardápio (ex.: "Indicação da casa", "Mais vendido"): o Administrador
-- cadastra os selos uma vez (Configurações → Selos) e escolhe, no produto, qual usar.
-- Paleta do Point: laranja (acompanha a cor de destaque do cardápio) e preto.

create type public.selo_cor as enum ('laranja', 'preto');

create table public.selos (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null check (char_length(btrim(texto)) between 1 and 24),
  cor        public.selo_cor not null default 'laranja',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.selos is
  'Selos de destaque exibidos nos produtos do cardápio público (texto curto + cor da paleta).';

-- Sem dois selos com o mesmo texto (ignora maiúsculas e espaços nas pontas).
create unique index selos_texto_unico on public.selos (lower(btrim(texto)));

alter table public.selos enable row level security;

create trigger selos_set_updated_at
  before update on public.selos
  for each row execute function public.set_updated_at();

create trigger selos_auditoria
  after insert or update or delete on public.selos
  for each row execute function public.registrar_auditoria();

-- Leitura pública só dos ATIVOS: o cardápio é montado com o cliente anon (carregarCardapioPublico)
-- e o selo vem junto do produto; selo desativado simplesmente deixa de aparecer.
create policy "selos_select_public"
  on public.selos for select
  to anon, authenticated
  using (ativo);

-- A equipe (Admin/Gerente) vê todos, inclusive os desativados, e gerencia.
create policy "selos_select_admin" on public.selos for select to authenticated using (public.is_admin());
create policy "selos_insert_admin" on public.selos for insert to authenticated with check (public.is_admin());
create policy "selos_update_admin" on public.selos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "selos_delete_admin" on public.selos for delete to authenticated using (public.is_admin());

-- Um selo por produto. Excluir o selo só tira o selo dos produtos (não apaga produto).
alter table public.produtos
  add column selo_id uuid references public.selos (id) on delete set null;

create index produtos_selo_idx on public.produtos (selo_id) where selo_id is not null;

comment on column public.produtos.selo_id is 'Selo exibido no produto (opcional).';
