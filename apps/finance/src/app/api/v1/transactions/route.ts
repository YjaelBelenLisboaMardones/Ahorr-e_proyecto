import type { NextRequest } from "next/server";
import { listTransactionsController, createTransactionController } from "@/modules/transactions/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listTransactionsController(request));
}

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createTransactionController(request));
}
