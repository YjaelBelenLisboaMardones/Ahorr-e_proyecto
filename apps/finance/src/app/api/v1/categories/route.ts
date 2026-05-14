import type { NextRequest } from "next/server";
import { listCategoriesController, createCategoryController } from "@/modules/categories/controllers";
import { withErrorHandler } from "@ahorre/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listCategoriesController(request));
}

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createCategoryController(request));
}
