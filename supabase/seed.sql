-- Point07 — Seed de desenvolvimento local (roda no `supabase db reset`)
-- ⚠️ Dados de EXEMPLO. Número real de mesas e de usuários ainda A CONFIRMAR com o cliente.
-- ⚠️ Ambiente local apenas. Senha padrão: "point07dev".

-- ---------------------------------------------------------------------------
-- Usuários internos de bootstrap
-- O primeiro Administrador precisa existir antes de qualquer login; os demais
-- usuários podem ser criados pela própria interface (/painel/usuarios).
-- ---------------------------------------------------------------------------
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
  g1_id    uuid := '00000000-0000-0000-0000-0000000000b1';
  g2_id    uuid := '00000000-0000-0000-0000-0000000000b2';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
     'admin@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"Administrador Point07","role":"admin"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', g1_id, 'authenticated', 'authenticated',
     'joao@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"João (garçom)","role":"garcom"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', g2_id, 'authenticated', 'authenticated',
     'maria@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"Maria (garçom)","role":"garcom"}', now(), now());

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), admin_id, admin_id::text,
     jsonb_build_object('sub', admin_id::text, 'email', 'admin@point07.local'),
     'email', now(), now(), now()),
    (gen_random_uuid(), g1_id, g1_id::text,
     jsonb_build_object('sub', g1_id::text, 'email', 'joao@point07.local'),
     'email', now(), now(), now()),
    (gen_random_uuid(), g2_id, g2_id::text,
     jsonb_build_object('sub', g2_id::text, 'email', 'maria@point07.local'),
     'email', now(), now(), now());
end $$;

-- ---------------------------------------------------------------------------
-- Mesas de exemplo (4 internas + 2 externas)
-- ---------------------------------------------------------------------------
insert into public.mesas (identificador, apelido, area) values
  ('Mesa 01', null,            'interna'),
  ('Mesa 02', null,            'interna'),
  ('Mesa 03', null,            'interna'),
  ('Mesa 04', 'Mesa do canto', 'interna'),
  ('Externa 01', 'Varanda',    'externa'),
  ('Externa 02', 'Calçada',    'externa');
