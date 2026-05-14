-- =====================================================================
-- Ahorr-E — Row Level Security para `public.expenses`
-- Cumple RNF1 y RNF3: cada usuario solo accede a sus propios gastos.
-- Ejecutar UNA sola vez en el SQL Editor de Supabase.
-- =====================================================================

alter table public.expenses enable row level security;

-- SELECT: cada usuario lee solo sus gastos.
drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
on public.expenses
for select
using (auth.uid() = "profileId");

-- INSERT: cada usuario solo crea gastos para sí mismo.
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
on public.expenses
for insert
with check (auth.uid() = "profileId");

-- UPDATE: bloqueado en este feature (los gastos no se editan, solo se eliminan
-- y se crean de nuevo). Si más adelante se permite editar, agregar policy.
drop policy if exists "expenses_update_blocked" on public.expenses;
create policy "expenses_update_blocked"
on public.expenses
for update
using (false);

-- DELETE: cada usuario solo elimina sus propios gastos.
drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
on public.expenses
for delete
using (auth.uid() = "profileId");
