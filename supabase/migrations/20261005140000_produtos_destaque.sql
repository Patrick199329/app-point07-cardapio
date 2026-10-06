-- Produtos marcados como destaque aparecem num carrossel no topo do cardápio público.
alter table public.produtos
  add column destaque boolean not null default false;

comment on column public.produtos.destaque is
  'Quando true, o produto aparece no bloco Destaques no topo do cardápio público.';
