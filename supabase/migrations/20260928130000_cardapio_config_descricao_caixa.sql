-- Point07 — Módulo 1: padrão de caixa (maiúsculas/minúsculas) pra exibição
-- da descrição dos produtos no cardápio público. Os dados migrados do
-- WordPress vêm sem padrão (mistura de tudo maiúsculo e texto normal) — em
-- vez de reeditar cada um dos ~200 itens na mão, o Administrador escolhe um
-- padrão de exibição global. Não altera o texto salvo, só como ele aparece.

create type public.cardapio_descricao_caixa as enum ('original', 'maiusculo', 'frase');

alter table public.cardapio_config
  add column descricao_caixa public.cardapio_descricao_caixa not null default 'original';

comment on column public.cardapio_config.descricao_caixa is
  'Como normalizar a caixa da descrição dos produtos no /cardapio público (não altera o texto salvo).';
