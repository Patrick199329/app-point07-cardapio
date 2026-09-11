-- Point07 — Módulo 1: grupos de opções informativos por produto.
-- Ortogonal ao modelo de preço (simples/tamanhos/compartilhar): qualquer produto pode ter
-- zero ou mais grupos ("Todas Acompanham", "Escolha 1 Carne", "Escolha o Sabor"...). É só
-- informativo — sem seleção interativa nem total calculado (cardápio é só consulta).

create table public.produto_grupos_opcoes (
  id         uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos (id) on delete cascade,
  titulo     text not null,
  observacao text,
  ordem      integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.produto_grupos_opcoes is
  'Blocos informativos de um produto (ex.: "Escolha 1 Carne"). O texto do título já carrega a semântica (Escolha N / Todas Acompanham) — sem seleção interativa.';
comment on column public.produto_grupos_opcoes.observacao is
  'Texto livre opcional, ex.: "Será cobrado R$ 9,00 por acréscimo de carne".';

create table public.produto_opcoes (
  id         uuid primary key default gen_random_uuid(),
  grupo_id   uuid not null references public.produto_grupos_opcoes (id) on delete cascade,
  nome       text not null,
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.produto_opcoes is
  'Itens de um grupo de opções (ex.: "Frango", "Calabresa"). Sem preço próprio.';

create index produto_grupos_opcoes_produto_ordem_idx
  on public.produto_grupos_opcoes (produto_id, ordem);
create index produto_opcoes_grupo_ordem_idx
  on public.produto_opcoes (grupo_id, ordem);

alter table public.produto_grupos_opcoes enable row level security;
alter table public.produto_opcoes enable row level security;

create trigger produto_grupos_opcoes_set_updated_at
  before update on public.produto_grupos_opcoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — mesmo princípio de categorias/produtos: anon só vê o que está ativo;
-- aqui a "ativação" é herdada do produto (não existe ativo próprio no grupo/opção).
-- ---------------------------------------------------------------------------

create policy "produto_grupos_select_anon"
  on public.produto_grupos_opcoes for select
  to anon
  using (exists (
    select 1 from public.produtos p where p.id = produto_id and p.ativo
  ));

create policy "produto_grupos_select_auth"
  on public.produto_grupos_opcoes for select
  to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.produtos p where p.id = produto_id and p.ativo)
  );

create policy "produto_grupos_insert_admin"
  on public.produto_grupos_opcoes for insert
  to authenticated
  with check (public.is_admin());

create policy "produto_grupos_update_admin"
  on public.produto_grupos_opcoes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "produto_grupos_delete_admin"
  on public.produto_grupos_opcoes for delete
  to authenticated
  using (public.is_admin());

create policy "produto_opcoes_select_anon"
  on public.produto_opcoes for select
  to anon
  using (exists (
    select 1
    from public.produto_grupos_opcoes g
    join public.produtos p on p.id = g.produto_id
    where g.id = grupo_id and p.ativo
  ));

create policy "produto_opcoes_select_auth"
  on public.produto_opcoes for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.produto_grupos_opcoes g
      join public.produtos p on p.id = g.produto_id
      where g.id = grupo_id and p.ativo
    )
  );

create policy "produto_opcoes_insert_admin"
  on public.produto_opcoes for insert
  to authenticated
  with check (public.is_admin());

create policy "produto_opcoes_delete_admin"
  on public.produto_opcoes for delete
  to authenticated
  using (public.is_admin());
