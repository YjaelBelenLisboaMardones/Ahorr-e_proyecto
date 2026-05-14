-- =====================================================================
-- Ahorr-E — Trigger: auth.users -> public.profiles
-- Ejecutar UNA sola vez en el SQL Editor del dashboard de Supabase.
-- =====================================================================
-- Cada vez que Supabase Auth crea un usuario, este trigger crea
-- automáticamente el row correspondiente en `public.profiles` con el
-- mismo UUID. El campo `full_name` viene del raw_user_meta_data que
-- pasamos al hacer signUp con `options.data.full_name`.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, "fullName", "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
