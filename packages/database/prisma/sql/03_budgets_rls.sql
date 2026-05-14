-- =====================================================================
-- Ahorr-E — Row Level Security para `public.budgets`
-- Cumple RNF1 y RNF3: cada usuario solo accede a sus propios presupuestos.
-- Ejecutar UNA sola vez en el SQL Editor de Supabase.
-- =====================================================================

alter table public.budgets enable row level security;

-- SELECT: cada usuario lee solo sus presupuestos.
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
on public.budgets
for select
using (auth.uid() = "profileId");

-- INSERT: cada usuario solo crea presupuestos para sí mismo.
drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
on public.budgets
for insert
with check (auth.uid() = "profileId");

-- UPDATE: cada usuario solo modifica sus propios presupuestos.
drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
on public.budgets
for update
using (auth.uid() = "profileId")
with check (auth.uid() = "profileId");

-- DELETE: cada usuario solo elimina sus propios presupuestos.
drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
on public.budgets
for delete
using (auth.uid() = "profileId");
