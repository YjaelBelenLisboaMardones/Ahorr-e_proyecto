import { NextResponse } from "next/server";
import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";
import { HTTP_STATUS } from "../constants/http-status";
import { fail } from "../responses/api-response";

type RouteHandlerResponse<T> = Promise<NextResponse<T>>;

export const withErrorHandler = async <T>(
  fn: () => RouteHandlerResponse<T>
): Promise<NextResponse> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.message, error.code, error.details, error.statusCode);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[withErrorHandler]", message);
    return fail(
      "Internal server error.",
      ERROR_CODES.INTERNAL_ERROR,
      process.env["NODE_ENV"] === "development" ? message : undefined,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};
