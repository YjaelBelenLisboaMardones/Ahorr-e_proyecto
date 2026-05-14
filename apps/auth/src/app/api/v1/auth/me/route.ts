import type { NextRequest } from "next/server";
import { meController } from "@/modules/users/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => meController(request));
}
