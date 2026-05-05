"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/services/auth/profile-repository";

export type AuthState = {
  error?: string;
};

/**
 * Inicia sesión con email + password. En éxito redirige a /dashboard
 * (o a `next` si la URL trae redirect intent).
 */
export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Ingresa email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traducirError(error.message) };
  }

  redirect(next);
}

/**
 * Registra un usuario nuevo. Supabase enviará un email de confirmación
 * (si está configurado en el dashboard). Tras confirmar, el trigger en
 * la BD crea automáticamente el row en `profiles`.
 */
export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { error: "Ingresa email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  // Fallback: si el trigger SQL no estuviera activo, igual creamos el profile.
  // Si el trigger ya creó el row, `ensureProfile` es idempotente y no falla.
  if (data.user) {
    await ensureProfile({
      id: data.user.id,
      email: data.user.email ?? email,
      fullName: fullName || null,
    });
  }

  // Con "Confirm email" desactivado, signUp ya deja sesión iniciada.
  // Si por alguna razón no quedó sesión, hacemos signIn explícito.
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return { error: traducirError(signInError.message) };
    }
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function traducirError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    "User already registered": "Este email ya está registrado.",
    "Email not confirmed": "Confirma tu email antes de iniciar sesión.",
  };
  return map[msg] ?? msg;
}
