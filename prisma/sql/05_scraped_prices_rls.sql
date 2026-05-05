-- =====================================================================
-- Ahorr-E — Row Level Security para `public.scraped_prices`
-- A diferencia de profiles/budgets/expenses, este caché NO es por usuario:
-- los precios scrapeados son data compartida (RNF6 — fiabilidad).
-- Solo restringimos: lectura para autenticados, escritura solo desde server.
-- Ejecutar UNA sola vez en el SQL Editor de Supabase.
-- =====================================================================

alter table public.scraped_prices enable row level security;

-- SELECT: cualquier usuario autenticado puede leer el caché de precios.
drop policy if exists "scraped_prices_select_authenticated" on public.scraped_prices;
create policy "scraped_prices_select_authenticated"
on public.scraped_prices
for select
to authenticated
using (true);

-- INSERT/UPDATE/DELETE: bloqueados desde el cliente. Solo el servidor
-- (vía Prisma con DATABASE_URL = postgres user) puede escribir.
-- Esto evita que un usuario falsifique precios desde el browser.
drop policy if exists "scraped_prices_insert_blocked" on public.scraped_prices;
create policy "scraped_prices_insert_blocked"
on public.scraped_prices
for insert
with check (false);

drop policy if exists "scraped_prices_update_blocked" on public.scraped_prices;
create policy "scraped_prices_update_blocked"
on public.scraped_prices
for update
using (false);

drop policy if exists "scraped_prices_delete_blocked" on public.scraped_prices;
create policy "scraped_prices_delete_blocked"
on public.scraped_prices
for delete
using (false);
