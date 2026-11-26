-- Cardápio público: três opções de como o PREÇO aparece (Configurações → Aparência).
-- Todas desligadas por padrão = o cardápio continua exatamente como era até o
-- Administrador ligar.

alter table public.cardapio_config
  add column if not exists preco_ocultar_centavos_zerados boolean not null default false,
  add column if not exists preco_cor_da_descricao boolean not null default false,
  add column if not exists preco_junto_da_descricao boolean not null default false;

comment on column public.cardapio_config.preco_ocultar_centavos_zerados is
  'Mostra 12 em vez de 12,00 (valores com centavos, como 12,50, não mudam).';
comment on column public.cardapio_config.preco_cor_da_descricao is
  'O preço usa a cor e o peso do texto da descrição, sem o destaque da cor do cardápio.';
comment on column public.cardapio_config.preco_junto_da_descricao is
  'O preço vai no fim da descrição, separado por um traço, em vez de numa linha própria.';
