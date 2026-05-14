import type { NextRequest, NextResponse } from "next/server";
import { requireAuth, ok } from "@ahorre/shared";
import { transactionsService } from "../services";

export const listTransactionsController = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await requireAuth(request);
  const transactions = await transactionsService.listByUser(auth.userId);
  return ok("Transacciones obtenidas.", transactions);
};
