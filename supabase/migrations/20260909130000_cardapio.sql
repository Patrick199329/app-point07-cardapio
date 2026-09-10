-- Point07 — Fase 2: Gestão de Cardápio (Módulo 1) + base do Cardápio Público (Módulo 2)
-- Categorias, produtos (4 templates — Modelo D tratado como itens simples na v1) e avisos.

create type public.produto_modelo as enum ('simples', 'tamanhos', 'compartilhar');

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------
create table public.categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  ordem      integer not null default 0,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categorias is 'Categorias do cardápio. ordem define a exibição no cardápio público.';

alter table public.categorias enable row level security;

create trigger categorias_set_updated_at
  before update on public.categorias
  for each row execute function public.set_updated_at();

create index categorias_ordem_idx on public.categorias (ordem);

-- ---------------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------------
create table public.produtos (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  nome         text not null,
  descricao    text,
  modelo       public.produto_modelo not null default 'simples',
  preco        numeric(10, 2),   -- 'simples' e 'compartilhar'
  preco_medio  numeric(10, 2),   -- 'tamanhos'
  preco_grande numeric(10, 2),   -- 'tamanhos'
  serve_ate    smallint,         -- 'compartilhar' (opcional)
  imagem_path  text,             -- caminho do objeto no bucket 'cardapio'
  ordem        integer not null default 0,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint produtos_serve_ate_positivo check (serve_ate is null or serve_ate > 0),
  constraint produtos_precos_nao_negativos check (
    coalesce(preco, 0) >= 0 and coalesce(preco_medio, 0) >= 0 and coalesce(preco_grande, 0) >= 0
  ),
  -- Cada modelo usa só os campos de preço que fazem sentido para ele.
  constraint produtos_precos_por_modelo check (
    (modelo = 'simples'
      and preco is not null and preco_medio is null and preco_grande is null and serve_ate is null)
    or (modelo = 'tamanhos'
      and preco is null and preco_medio is not null and preco_grande is not null and serve_ate is null)
    or (modelo = 'compartilhar'
      and preco is not null and preco_medio is null and preco_grande is null)
  )
);

comment on table public.produtos is
  'Itens do cardápio. modelo: simples (preço único) | tamanhos (médio/grande) | compartilhar (preço + serve_ate).';

alter table public.produtos enable row level security;

create trigger produtos_set_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

create index produtos_categoria_ordem_idx on public.produtos (categoria_id, ordem);

-- ---------------------------------------------------------------------------
-- Avisos (taxa de embalagem, couvert artístico, etc.) — NÃO são produtos
-- ---------------------------------------------------------------------------
create table public.avisos (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null,
  ordem      integer not null default 0,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.avisos is 'Blocos de texto livre exibidos no cardápio público (avisos, taxas). Não são itens.';

alter table public.avisos enable row level security;

create trigger avisos_set_updated_at
  before update on public.avisos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
--   Leitura pública (anon): apenas registros ativos.
--   Leitura autenticada: ativos, ou tudo se Administrador.
--   Escrita: apenas Administrador.
-- ---------------------------------------------------------------------------
create policy "categorias_select_anon"  on public.categorias for select to anon           using (ativo);
create policy "categorias_select_auth"  on public.categorias for select to authenticated  using (ativo or public.is_admin());
create policy "categorias_insert_admin" on public.categorias for insert to authenticated  with check (public.is_admin());
create policy "categorias_update_admin" on public.categorias for update to authenticated  using (public.is_admin()) with check (public.is_admin());
create policy "categorias_delete_admin" on public.categorias for delete to authenticated  using (public.is_admin());

create policy "produtos_select_anon"    on public.produtos for select to anon           using (ativo);
create policy "produtos_select_auth"    on public.produtos for select to authenticated  using (ativo or public.is_admin());
create policy "produtos_insert_admin"   on public.produtos for insert to authenticated  with check (public.is_admin());
create policy "produtos_update_admin"   on public.produtos for update to authenticated  using (public.is_admin()) with check (public.is_admin());
create policy "produtos_delete_admin"   on public.produtos for delete to authenticated  using (public.is_admin());

create policy "avisos_select_anon"      on public.avisos for select to anon           using (ativo);
create policy "avisos_select_auth"      on public.avisos for select to authenticated  using (ativo or public.is_admin());
create policy "avisos_insert_admin"     on public.avisos for insert to authenticated  with check (public.is_admin());
create policy "avisos_update_admin"     on public.avisos for update to authenticated  using (public.is_admin()) with check (public.is_admin());
create policy "avisos_delete_admin"     on public.avisos for delete to authenticated  using (public.is_admin());
