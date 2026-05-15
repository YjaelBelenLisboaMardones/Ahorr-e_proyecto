import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, created, AppError, ERROR_CODES, HTTP_STATUS } from "@ahorre/shared";
import { categoriesService } from "../services";
import { createCategorySchema } from "../validators";

export const createCategoryController = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAuth(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Invalid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const result = createCategorySchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Payload inválido.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const category = await categoriesService.create(auth.userId, result.data);
  return created("Categoría creada.", category);
};
