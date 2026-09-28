-- Point07 — o padrão de cor_destaque ('#f07e22') falha o contraste mínimo do
-- WCAG AA (2,3:1 contra fundo branco/quase-branco; o exigido é 4,5:1) —
-- achado rodando Lighthouse/PageSpeed contra produção (28/09). Essa cor
-- pinta preço, categoria em foco e outros textos de destaque no cardápio
-- público, então baixo contraste é um problema real de leitura, não só nota.
--
-- Só troca o DEFAULT da coluna (pra quem parte do zero — `db reset` local,
-- projeto novo — já nascer com um laranja acessível). Não mexe na linha
-- existente (id=1): quem já customizou essa cor é atualizado à parte,
-- preservando o tom escolhido.

alter table public.cardapio_config
  alter column cor_destaque set default '#a85818';
