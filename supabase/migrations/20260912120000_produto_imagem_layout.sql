-- Point07 — Módulo 1: tamanho/layout de imagem por produto no cardápio público.
-- 'miniatura' (padrão, comportamento atual): foto pequena à esquerda do texto.
-- 'grande': foto maior, centralizada acima do nome/preço — para itens de destaque.

create type public.produto_imagem_layout as enum ('miniatura', 'grande');

alter table public.produtos
  add column imagem_layout public.produto_imagem_layout not null default 'miniatura';

comment on column public.produtos.imagem_layout is
  'Como a foto do produto aparece no cardápio público: miniatura (pequena, à esquerda) ou grande (centralizada).';
