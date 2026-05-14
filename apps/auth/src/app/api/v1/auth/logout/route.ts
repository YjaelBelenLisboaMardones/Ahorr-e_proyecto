import type { NextRequest } from "next/server";
import { logoutController } from "@/modules/users/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => logoutController(request));
}
