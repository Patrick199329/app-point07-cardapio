-- Anexa o trigger genérico (public.registrar_auditoria(), definido na
-- migration anterior) nas tabelas editáveis pela equipe no painel.
--
-- profiles só leva trigger de UPDATE: criação de usuário passa pela Admin
-- API do Supabase (createAdminClient(), sem auth.uid() no contexto — ver
-- src/app/painel/usuarios/actions.ts), então é logada manualmente via
-- registrar_auditoria_manual() direto na Server Action, pra não perder o
-- autor nem duplicar o evento.

create trigger mesas_auditoria
  after insert or update or delete on public.mesas
  for each row execute function public.registrar_auditoria();

create trigger categorias_auditoria
  after insert or update or delete on public.categorias
  for each row execute function public.registrar_auditoria();

create trigger produtos_auditoria
  after insert or update or delete on public.produtos
  for each row execute function public.registrar_auditoria();

create trigger produto_grupos_opcoes_auditoria
  after insert or update or delete on public.produto_grupos_opcoes
  for each row execute function public.registrar_auditoria();

create trigger produto_opcoes_auditoria
  after insert or update or delete on public.produto_opcoes
  for each row execute function public.registrar_auditoria();

create trigger avisos_auditoria
  after insert or update or delete on public.avisos
  for each row execute function public.registrar_auditoria();

create trigger cardapio_config_auditoria
  after insert or update or delete on public.cardapio_config
  for each row execute function public.registrar_auditoria();

create trigger sistema_config_auditoria
  after insert or update or delete on public.sistema_config
  for each row execute function public.registrar_auditoria();

create trigger fila_config_auditoria
  after insert or update or delete on public.fila_config
  for each row execute function public.registrar_auditoria();

create trigger profiles_auditoria_update
  after update on public.profiles
  for each row execute function public.registrar_auditoria();
