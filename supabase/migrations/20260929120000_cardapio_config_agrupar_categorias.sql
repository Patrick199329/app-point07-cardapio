-- Permite apresentar o cardapio publico como um conjunto de categorias
-- recolhiveis. Mantem o comportamento atual como padrao para nao alterar a
-- experiencia de quem ja usa o sistema ate o Administrador ativar a opcao.

alter table public.cardapio_config
  add column agrupar_categorias boolean not null default false;

comment on column public.cardapio_config.agrupar_categorias is
  'Agrupa os produtos em categorias expansíveis no cardápio público.';

