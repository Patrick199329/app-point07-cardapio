-- Cada aviso decide se fica travado na tela (fixo) ou só no fim da página.
-- Remove o interruptor global que tinha sido criado antes em cardapio_config.
alter table public.cardapio_config drop column if exists avisos_fixos;

alter table public.avisos
  add column fixo boolean not null default true;

comment on column public.avisos.fixo is
  'Quando true, o aviso fica fixo na parte de baixo da tela; quando false, aparece só no fim da página.';
