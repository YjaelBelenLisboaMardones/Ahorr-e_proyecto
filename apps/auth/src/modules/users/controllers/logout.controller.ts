import type { NextRequest, NextResponse } from "next/server";
import { ok } from "@ahorre/shared";

export const logoutController = async (_request: NextRequest): Promise<NextResponse> => {
  // JWT-based: el cliente descarta el token. El servidor señaliza éxito.
  return ok("Sesión cerrada exitosamente.", null);
};
