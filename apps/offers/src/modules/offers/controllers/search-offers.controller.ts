import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok, AppError, ERROR_CODES, HTTP_STATUS } from "@ahorre/shared";
import { offersService } from "../services";

export const searchOffersController = async (request: NextRequest): Promise<NextResponse> => {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query?.trim()) {
    throw new AppError("Parámetro q es requerido.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const offers = await offersService.search(query.trim());
  return ok("Ofertas obtenidas.", offers);
};
