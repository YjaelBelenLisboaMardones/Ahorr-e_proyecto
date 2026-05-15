import type { NextRequest } from "next/server";
import { listBudgetsController, createBudgetController } from "@/modules/budgets/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listBudgetsController(request));
}

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createBudgetController(request));
}
