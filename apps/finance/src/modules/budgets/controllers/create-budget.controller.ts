import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, created, AppError, ERROR_CODES, HTTP_STATUS } from "@ahorre/shared";
import { budgetsService } from "../services";
import { createBudgetSchema } from "../validators";

export const createBudgetController = async (request: NextRequest): Promise<NextResponse> => {
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

  const result = createBudgetSchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Payload inválido.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const budget = await budgetsService.create(auth.userId, result.data);
  return created("Presupuesto creado.", budget);
};
