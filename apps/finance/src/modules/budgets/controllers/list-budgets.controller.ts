import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok } from "@ahorre/shared";
import { budgetsService } from "../services";

export const listBudgetsController = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAuth(request);
  const budgets = await budgetsService.listByUser(auth.userId);
  return ok("Presupuestos obtenidos.", budgets);
};
