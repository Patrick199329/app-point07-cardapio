-- Point07 — Fase 2: policies do bucket de imagens do cardápio.
-- O bucket 'cardapio' é criado pelo supabase/config.toml ([storage.buckets.cardapio]).
-- Uploads são feitos pelo servidor com a chave service_role (ignora RLS); estas
-- policies são defesa em profundidade caso a escrita passe a usar o cliente do admin.

-- Leitura pública das imagens do cardápio (o bucket também é public = true).
create policy "cardapio_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cardapio');

-- Escrita restrita ao Administrador.
create policy "cardapio_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cardapio' and public.is_admin());

create policy "cardapio_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cardapio' and public.is_admin())
  with check (bucket_id = 'cardapio' and public.is_admin());

create policy "cardapio_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cardapio' and public.is_admin());
