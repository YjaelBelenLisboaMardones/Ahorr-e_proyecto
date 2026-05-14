import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Handler para el callback de email confirmation de Supabase Auth.
 * Cuando el usuario hace clic en el link del email, Supabase lo redirige
 * acá con un `code` que canjeamos por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
