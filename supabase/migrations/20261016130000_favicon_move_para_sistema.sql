-- Favicon move de cardapio_config pra sistema_config -- o Patrick preferiu
-- gerenciar junto da identidade do sistema (mesma tela da logo interna).
alter table public.sistema_config
  add column favicon_path text;

alter table public.cardapio_config
  drop column if exists favicon_path;
