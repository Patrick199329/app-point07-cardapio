-- Tempo parado (aba escondida/sem uso) até o cardápio público perguntar
-- "ainda está na mesa X?" antes de liberar o Chamar garçom de novo — hoje
-- fixo em 15min no código, o Administrador pediu pra deixar configurável.

alter table public.cardapio_config
  add column mesa_confirmar_apos_minutos smallint not null default 15
    check (mesa_confirmar_apos_minutos between 1 and 180);

comment on column public.cardapio_config.mesa_confirmar_apos_minutos is
  'Minutos parado (aba escondida) até perguntar se o cliente ainda está na mesma mesa.';
