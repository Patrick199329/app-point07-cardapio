-- Cardápio público: mostrar ou não o símbolo "R$" nos preços. Pedido do cliente
-- foi exibir só o valor (8,50), então o padrão é desligado; o Administrador pode
-- ligar em Configurações → Aparência do cardápio.

alter table public.cardapio_config
  add column if not exists mostrar_simbolo_moeda boolean not null default false;

comment on column public.cardapio_config.mostrar_simbolo_moeda is
  'Exibe o símbolo R$ antes dos preços no cardápio público (desligado = só o valor).';
