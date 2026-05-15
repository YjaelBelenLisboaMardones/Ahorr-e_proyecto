import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok, NotFoundError } from "@ahorre/shared";
import { prisma } from "@ahorre/database";

export const meController = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAuth(request);

  const profile = await prisma.userProfile.findUnique({ where: { userId: auth.userId } });
  if (!profile) throw new NotFoundError("Perfil no encontrado.");

  return ok("Perfil obtenido.", profile);
};
