import type { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseClient,
  AppError,
  ERROR_CODES,
  HTTP_STATUS,
  created,
} from "@ahorre/shared";
import { prisma } from "@ahorre/database";
import { signupSchema } from "../validators";

export const signupController = async (request: NextRequest): Promise<NextResponse> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const result = signupSchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Payload de registro inválido.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const { email, password, fullName, role } = result.data;
  const adminClient = getSupabaseAdminClient();

  const { data: createdAuthUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (createError) {
    const msg = createdAuthUser?.user ? "" : (createError.message ?? "");
    const isDuplicate =
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered") ||
      createError.code === "email_exists";
    throw new AppError(isDuplicate ? "Este correo ya está registrado." : msg, {
      statusCode: isDuplicate ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST,
      code: isDuplicate ? ERROR_CODES.CONFLICT : ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const authUserId = createdAuthUser.user.id;

  const anonClient = getSupabaseClient();
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError ?? !signInData.session) {
    await adminClient.auth.admin.deleteUser(authUserId);
    throw new AppError("No se pudo iniciar sesión tras el registro.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: authUserId },
    update: {},
    create: { userId: authUserId, fullName, role },
  });

  return created("Usuario registrado exitosamente.", {
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    user: signInData.user,
    profile,
  });
};
