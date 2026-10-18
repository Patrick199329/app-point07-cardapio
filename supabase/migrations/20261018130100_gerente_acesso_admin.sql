-- is_admin() é o único helper usado por todas as RLS policies e RPCs do
-- projeto (profiles, cardápio, mesas, storage, chamados, configurações).
-- Decisão do cliente: Gerente tem o mesmo nível de acesso do Administrador.
-- Ampliar o critério aqui propaga a autorização pra Gerente em todo o banco
-- sem precisar reescrever cada policy individualmente.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'gerente')
      and ativo
  );
$$;

comment on function public.is_admin() is
  'True se o usuário autenticado é Administrador ou Gerente ativo (mesmo nível de acesso, por decisão do cliente). Usada nas RLS policies e RPCs.';
