-- Point07 — generaliza o modelo 'tamanhos' pra rótulos configuráveis.
-- Motivação: migração do cardápio real do WordPress trouxe pares de preço que
-- não são "Médio/Grande" (Dose/Litro, Taça/Garrafa, Unidade/Balde de 5) — os
-- rótulos eram fixos no código. Preço em si continua em preco_medio/preco_grande;
-- só o texto exibido passa a ser dado do produto.

alter table public.produtos
  add column preco_medio_label text,
  add column preco_grande_label text;

comment on column public.produtos.preco_medio_label is
  'Rótulo do 1º preço do modelo "tamanhos" (ex.: Médio, Dose, Taça, Unidade).';
comment on column public.produtos.preco_grande_label is
  'Rótulo do 2º preço do modelo "tamanhos" (ex.: Grande, Litro, Garrafa, Balde de 5).';

-- Produtos 'tamanhos' já cadastrados (seed/testes locais) usavam Médio/Grande
-- fixo no código — backfill pra manter o comportamento atual.
update public.produtos
set preco_medio_label = 'Médio', preco_grande_label = 'Grande'
where modelo = 'tamanhos';

alter table public.produtos drop constraint produtos_precos_por_modelo;

alter table public.produtos add constraint produtos_precos_por_modelo check (
  (modelo = 'simples'
    and preco is not null and preco_medio is null and preco_grande is null and serve_ate is null
    and preco_medio_label is null and preco_grande_label is null)
  or (modelo = 'tamanhos'
    and preco is null and preco_medio is not null and preco_grande is not null and serve_ate is null
    and preco_medio_label is not null and preco_grande_label is not null)
  or (modelo = 'compartilhar'
    and preco is not null and preco_medio is null and preco_grande is null
    and preco_medio_label is null and preco_grande_label is null)
);
