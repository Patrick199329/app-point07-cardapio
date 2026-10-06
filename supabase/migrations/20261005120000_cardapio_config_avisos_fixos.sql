-- Avisos (taxa, couvert etc.) travados na tela (padrão) ou só no rodapé da página.
alter table public.cardapio_config
  add column avisos_fixos boolean not null default true;

comment on column public.cardapio_config.avisos_fixos is
  'Quando true, os avisos ficam fixos na parte de baixo da tela; quando false, aparecem só no fim da página.';
