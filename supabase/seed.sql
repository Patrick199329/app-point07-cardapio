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
  -- confirmation_token, recovery_token, email_change_token_new e email_change
  -- não têm DEFAULT em auth.users e o GoTrue quebra se ficarem NULL
  -- ("Database error querying schema" no login) — por isso setamos '' explicitamente.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
     'admin@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"Administrador Point07","role":"admin"}', now(), now(),
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', g1_id, 'authenticated', 'authenticated',
     'joao@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"João (garçom)","role":"garcom"}', now(), now(),
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', g2_id, 'authenticated', 'authenticated',
     'maria@point07.local', extensions.crypt('point07dev', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}',
     '{"nome":"Maria (garçom)","role":"garcom"}', now(), now(),
     '', '', '', '');

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

-- ---------------------------------------------------------------------------
-- Cardápio de exemplo (Fase 2) — dados fictícios, a migração real vem depois
-- ---------------------------------------------------------------------------
do $$
declare
  cat_bebidas uuid;
  cat_entradas uuid;
  cat_porcoes uuid;
  cat_tabuas uuid;
begin
  insert into public.categorias (nome, ordem) values ('Bebidas', 0) returning id into cat_bebidas;
  insert into public.categorias (nome, ordem) values ('Entradas', 1) returning id into cat_entradas;
  insert into public.categorias (nome, ordem) values ('Porções', 2) returning id into cat_porcoes;
  insert into public.categorias (nome, ordem) values ('Tábuas Especiais', 3) returning id into cat_tabuas;

  -- Modelo A — item simples
  insert into public.produtos (categoria_id, nome, descricao, modelo, preco, ordem) values
    (cat_bebidas, 'Chope Pilsen 300ml', 'Puro malte, bem gelado', 'simples', 8.50, 0),
    (cat_bebidas, 'Refrigerante lata', 'Coca-Cola, Guaraná ou Sprite', 'simples', 6.00, 1),
    (cat_bebidas, 'Água mineral 500ml', null, 'simples', 5.50, 2);

  -- Modelo B — item com tamanhos (médio / grande)
  insert into public.produtos (categoria_id, nome, descricao, modelo, preco_medio, preco_grande, ordem) values
    (cat_entradas, 'Bolinho de bacalhau', 'Porção com 6 ou 12 unidades', 'tamanhos', 34.00, 58.00, 0),
    (cat_porcoes, 'Batata frita', 'Crocante, com alecrim', 'tamanhos', 29.00, 45.00, 0),
    (cat_porcoes, 'Calabresa acebolada', null, 'tamanhos', 39.00, 62.00, 1);

  -- Modelo C — item para compartilhar
  insert into public.produtos (categoria_id, nome, descricao, modelo, preco, serve_ate, ordem) values
    (cat_tabuas, 'Tábua de frios', 'Queijos, embutidos, azeitonas e pães', 'compartilhar', 129.00, 4, 0),
    (cat_tabuas, 'Tábua da casa', 'Seleção especial do chef', 'compartilhar', 219.00, 6, 1);
end $$;

insert into public.avisos (texto, ordem) values
  ('Taxa de embalagem para pedidos "para viagem": R$ 2,00.', 0),
  ('Couvert artístico: R$ 10,00 por pessoa quando houver música ao vivo.', 1);

-- ---------------------------------------------------------------------------
-- Chamados de exemplo (Fase 3) — para ver a fila e o histórico já populados
-- ---------------------------------------------------------------------------
do $$
declare
  m_02 uuid;
  m_ext01 uuid;
  m_03 uuid;
  g_joao uuid := '00000000-0000-0000-0000-0000000000b1';
begin
  select id into m_02 from public.mesas where identificador = 'Mesa 02';
  select id into m_ext01 from public.mesas where identificador = 'Externa 01';
  select id into m_03 from public.mesas where identificador = 'Mesa 03';

  -- pendente (aparece na fila do garçom)
  insert into public.chamados (mesa_id, criado_em)
  values (m_02, now() - interval '2 minutes');

  -- aceito (histórico — Módulo 4)
  insert into public.chamados (mesa_id, status, criado_em, aceito_em, garcom_id)
  values (m_03, 'aceito', now() - interval '40 minutes', now() - interval '38 minutes', g_joao);

  -- cancelado pelo cliente
  insert into public.chamados (mesa_id, status, criado_em, cancelado_em)
  values (m_ext01, 'cancelado', now() - interval '1 hour', now() - interval '58 minutes');
end $$;
