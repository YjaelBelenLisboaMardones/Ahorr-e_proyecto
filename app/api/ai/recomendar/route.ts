import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { recommendForProfile } from "@/services/ai/recommend-service";

/**
 * Endpoint del microservicio de IA (RF3 + RF6).
 * POST /api/ai/recomendar  body: { query: string }
 *
 * Devuelve recomendación generada con grounding sobre el payload del scraper
 * y el presupuesto del usuario autenticado. Aislado de la BD para que pueda
 * desplegarse como función serverless independiente si se requiere.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const query =
    typeof body === "object" && body !== null && "query" in body
      ? String((body as { query: unknown }).query ?? "").trim()
      : "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "El parámetro `query` debe tener al menos 2 caracteres" },
      { status: 400 },
    );
  }

  const result = await recommendForProfile(user.id, query);
  return NextResponse.json(result);
}
