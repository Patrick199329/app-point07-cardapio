-- Favicon do site (aba do navegador) — configurável em Aparência do Cardápio,
-- usado em todas as páginas (cardápio público e painel admin).
alter table public.cardapio_config
  add column favicon_path text;
