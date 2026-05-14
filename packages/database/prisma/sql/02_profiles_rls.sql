-- =====================================================================
-- Ahorr-E — Row Level Security para `public.profiles`
-- Cumple RNF1 (aislamiento) y RNF3 (seguridad) del informe técnico.
-- Ejecutar UNA sola vez en el SQL Editor del dashboard de Supabase
-- después del script 01_profiles_trigger.sql.
-- =====================================================================

alter table public.profiles enable row level security;

-- SELECT: cada usuario solo lee su propio profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

-- UPDATE: cada usuario solo modifica su propio profile.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- INSERT: bloqueado a clientes. Solo el trigger SECURITY DEFINER
-- (handle_new_user) o el service_role pueden insertar.
drop policy if exists "profiles_insert_blocked" on public.profiles;
create policy "profiles_insert_blocked"
on public.profiles
for insert
with check (false);

-- DELETE: bloqueado. La eliminación se cascadea desde auth.users
-- (manejado por la FK implícita; no exponemos delete a clientes).
drop policy if exists "profiles_delete_blocked" on public.profiles;
create policy "profiles_delete_blocked"
on public.profiles
for delete
using (false);
