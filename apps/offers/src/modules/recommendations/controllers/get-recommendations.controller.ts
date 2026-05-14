import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok, AppError, ERROR_CODES, HTTP_STATUS } from "@ahorre/shared";
import { offersService } from "../../offers/services";
import { generateRecommendations } from "../services";
import { recommendationRequestSchema } from "../validators";

export const getRecommendationsController = async (
  request: NextRequest
): Promise<NextResponse> => {
  await requireAuth(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Invalid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const result = recommendationRequestSchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Payload inválido.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const { query, userContext } = result.data;

  // RF2: buscar ofertas (cache-first)
  const offers = await offersService.search(query);

  // RF3+RF6: recomendación con grounding en el payload del scraper
  let recommendation: string;
  try {
    recommendation = await generateRecommendations({
      query,
      offers,
      ...(userContext !== undefined ? { userContext } : {}),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      recommendation =
        "⚠️ El servicio de IA está temporalmente no disponible (límite de uso alcanzado). " +
        "Podés ver las ofertas y comparar precios manualmente. " +
        "Intentá de nuevo en unos minutos.";
    } else {
      throw err;
    }
  }

  return ok("Recomendaciones generadas.", {
    query,
    recommendation,
    offersCount: offers.length,
  });
};
