import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes que corren en el navegador
 * (componentes con `'use client'`).
 * Solo usa la anon key — protegida por RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
