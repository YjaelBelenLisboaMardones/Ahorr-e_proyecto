import type { NextRequest } from "next/server";
import { loginController } from "@/modules/users/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => loginController(request));
}
