-- Point07 — Fase 1: extensões e funções auxiliares
-- Base para as demais migrations (triggers de updated_at, hashing de senha no seed).

create extension if not exists pgcrypto with schema extensions;

-- Trigger genérico: mantém a coluna updated_at sempre em now() a cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: seta updated_at = now(). Usada por profiles, mesas, etc.';
