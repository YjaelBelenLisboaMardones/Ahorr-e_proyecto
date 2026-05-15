import type { NextRequest } from "next/server";
import { searchOffersController } from "@/modules/offers/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => searchOffersController(request));
}
