import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";
import { HTTP_STATUS } from "../constants/http-status";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.", details?: unknown) {
    super(message, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: ERROR_CODES.UNAUTHORIZED,
      details,
    });
  }
}
