-- Point07 — Módulo 1: mais controle sobre o cabeçalho do cardápio público
-- (posição e tamanho da logo, cor do texto/elementos para contraste).

create type public.cardapio_logo_posicao as enum ('esquerda', 'centro', 'direita');
create type public.cardapio_logo_tamanho as enum ('pequeno', 'medio', 'grande');

alter table public.cardapio_config
  add column logo_posicao public.cardapio_logo_posicao not null default 'esquerda',
  add column logo_tamanho public.cardapio_logo_tamanho not null default 'medio',
  add column cor_texto_cabecalho text not null default '#111111';

comment on column public.cardapio_config.cor_texto_cabecalho is
  'Cor do nome do estabelecimento, indicador de mesa e chips de categoria — para contraste com cor_fundo_cabecalho.';
