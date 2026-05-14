import type { NextRequest } from "next/server";
import { getRecommendationsController } from "@/modules/recommendations/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => getRecommendationsController(request));
}
