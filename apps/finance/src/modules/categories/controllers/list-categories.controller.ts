import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok } from "@ahorre/shared";
import { categoriesService } from "../services";

export const listCategoriesController = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAuth(request);
  const categories = await categoriesService.listByUser(auth.userId);
  return ok("Categorías obtenidas.", categories);
};
