import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, AppError, ERROR_CODES, HTTP_STATUS, ok } from "@ahorre/shared";
import { loginSchema } from "../validators";

export const loginController = async (request: NextRequest): Promise<NextResponse> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Invalid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Payload de login inválido.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const { email, password } = result.data;
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error ?? !data.session) {
    throw new AppError("Credenciales incorrectas.", {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }

  return ok("Login exitoso.", {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user,
  });
};
