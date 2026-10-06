-- Tamanho das fotos nos cards de produto: pequeno, médio ou grande (ocupa o lado do card).
alter table public.cardapio_config
  add column tamanho_imagem_produto text not null default 'pequeno'
    check (tamanho_imagem_produto in ('pequeno', 'medio', 'grande'));
