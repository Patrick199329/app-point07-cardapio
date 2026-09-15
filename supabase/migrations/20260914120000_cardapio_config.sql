-- Point07 — Módulo 1: aparência do cardápio público (configuração única/singleton).
-- Uma linha só (id = 1): todo o cardápio compartilha a mesma identidade visual.

create type public.cardapio_arredondamento as enum ('nenhum', 'pequeno', 'medio', 'grande');

create table public.cardapio_config (
  id                       smallint primary key default 1 check (id = 1),
  nome_estabelecimento     text not null default 'Point07',
  logo_path                text,
  mostrar_nome_com_logo    boolean not null default true,
  cor_fundo                text not null default '#f5f5f4',
  cor_fundo_cabecalho      text not null default '#ffffff',
  cor_bloco                text not null default '#ffffff',
  cor_destaque             text not null default '#f07e22',
  sombra                   boolean not null default true,
  arredondamento           public.cardapio_arredondamento not null default 'medio',
  categorias_centralizadas boolean not null default false,
  updated_at               timestamptz not null default now()
);

comment on table public.cardapio_config is
  'Aparência do cardápio público (/cardapio, /mesa/[token]). Singleton — sempre a linha id=1.';

insert into public.cardapio_config (id) values (1);

alter table public.cardapio_config enable row level security;

create trigger cardapio_config_set_updated_at
  before update on public.cardapio_config
  for each row execute function public.set_updated_at();

-- Leitura pública: /cardapio e /mesa/[token] carregam a config sem sessão (anon).
create policy "cardapio_config_select_all"
  on public.cardapio_config for select
  to anon, authenticated
  using (true);

-- Escrita só do Administrador. Sem insert/delete — a linha é fixa (id=1, seedada acima).
create policy "cardapio_config_update_admin"
  on public.cardapio_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
