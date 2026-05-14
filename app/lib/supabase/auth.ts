import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Devuelve el usuario autenticado o `null` si no hay sesión.
 * Usar en Server Components donde la ausencia de usuario no es un error.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Devuelve el usuario autenticado o redirige a /login.
 * Usar en Server Components que requieren sesión obligatoria.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
