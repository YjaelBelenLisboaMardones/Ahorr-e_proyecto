import type { NextRequest } from "next/server";
import { signupController } from "@/modules/users/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => signupController(request));
}
