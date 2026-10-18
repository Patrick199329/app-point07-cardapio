-- Publicação manual do cardápio: edições ficam só no "rascunho" (as tabelas
-- de sempre) até o Administrador clicar em "Publicar". O público lê de uma
-- foto congelada (cardapio_publicado.dados), não das tabelas ao vivo.

-- Marca toda vez que alguma edição relevante acontece (categorias, produtos,
-- opções, avisos, aparência) — comparado com cardapio_publicado.publicado_em
-- pra saber se há alterações pendentes.
create table public.cardapio_rascunho_status (
  id smallint primary key default 1,
  alterado_em timestamptz not null default now(),
  constraint cardapio_rascunho_status_singleton check (id = 1)
);
insert into public.cardapio_rascunho_status (id) values (1);

-- Foto do cardápio no momento da última publicação — exatamente o formato
-- que carregarCardapioPublico() monta hoje (categorias, destaques, avisos,
-- config), só que congelado em JSON em vez de calculado a cada request.
create table public.cardapio_publicado (
  id smallint primary key default 1,
  dados jsonb not null,
  publicado_em timestamptz not null default now(),
  publicado_por uuid references public.profiles(id),
  constraint cardapio_publicado_singleton check (id = 1)
);

alter table public.cardapio_rascunho_status enable row level security;
alter table public.cardapio_publicado enable row level security;

-- Leitura pública: o cardápio público e os painéis leem isso sem sessão.
create policy "cardapio_rascunho_status_select_all"
  on public.cardapio_rascunho_status for select
  to anon, authenticated
  using (true);

create policy "cardapio_publicado_select_all"
  on public.cardapio_publicado for select
  to anon, authenticated
  using (true);

-- Escrita só via Server Action com requireRole('admin') (service/authenticated
-- client do servidor) — sem policy de insert/update pro admin aqui porque as
-- Server Actions já fazem a checagem de papel antes de chamar o Supabase;
-- ainda assim trava update pra admin, defesa em profundidade.
create policy "cardapio_rascunho_status_update_admin"
  on public.cardapio_rascunho_status for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "cardapio_publicado_update_admin"
  on public.cardapio_publicado for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Realtime: o cardápio público escuta isso pra saber quando recarregar.
alter publication supabase_realtime add table public.cardapio_publicado;
