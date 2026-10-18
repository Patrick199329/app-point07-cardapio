-- Point07 — "terceiro nível de admin": quem desenvolve a plataforma
-- (Innovation), separado do admin/gerente do cliente final. Usado só pelo
-- mecanismo de backup (ver docs/implantacao-backup-google-drive/) — não deve
-- aparecer pra ninguém do lado do cliente, mesmo quem for admin/gerente.

alter table public.profiles add column eh_admin_innovation boolean not null default false;

-- Trava no nível de COLUNA (não só RLS por linha): revoga o UPDATE amplo que
-- "authenticated" tem por padrão em profiles (não havia nenhum grant
-- explícito até aqui) e reconcede só nas colunas que a aplicação de fato
-- edita hoje (ver src/app/painel/usuarios/actions.ts: atualizarUsuario e
-- definirStatusUsuario). A coluna do flag fica de fora — nenhum usuário
-- autenticado consegue setar isso em si mesmo, nem chamando a API
-- diretamente com a própria sessão, só via service_role.
revoke update on public.profiles from authenticated;
grant update (nome, role, ativo) on public.profiles to authenticated;

-- Mesmo padrão de public.is_admin()/public.is_garcom() (migrations
-- 20260909120100 e 20260910120000).
create or replace function public.eh_admin_innovation()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select eh_admin_innovation from public.profiles where id = (select auth.uid())),
    false
  );
$$;

grant execute on function public.eh_admin_innovation() to authenticated;

comment on function public.eh_admin_innovation() is
  'True se o usuário autenticado é da equipe Innovation (terceiro nível, independente de admin/gerente do cliente) — usada só nas tabelas internas do mecanismo de backup.';

-- IMPORTANTE: de propósito, não existe nenhuma tela pra marcar isso — é
-- feito uma vez, direto via SQL/service_role:
--   update public.profiles set eh_admin_innovation = true where email = '<email>';
