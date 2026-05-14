import { type NextRequest } from "next/server";
import { updateSession } from "@app/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Aplica el middleware a todas las rutas EXCEPTO assets estáticos y APIs internas
 * de Next.js. La lista de exclusiones evita correr Supabase en cada imagen.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
