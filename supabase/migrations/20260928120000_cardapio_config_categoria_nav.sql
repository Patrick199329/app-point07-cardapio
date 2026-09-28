-- Point07 — Módulo 1: cor de fundo dos botões (chips) de navegação de
-- categoria no cabeçalho do cardápio público. Hoje eles são só contorno
-- (sem preenchimento); isso dá ao Administrador a opção de preencher, pra
-- mais flexibilidade visual (ex.: destacar mais a categoria selecionada).

alter table public.cardapio_config
  add column cor_categoria_nav_fundo text not null default '#ffffff',
  add column cor_categoria_nav_fundo_ativa text not null default '#ffffff';

comment on column public.cardapio_config.cor_categoria_nav_fundo is
  'Fundo dos chips de categoria no cabeçalho quando NÃO é a categoria em foco.';
comment on column public.cardapio_config.cor_categoria_nav_fundo_ativa is
  'Fundo do chip da categoria em foco (a que está visível na tela ao rolar).';
