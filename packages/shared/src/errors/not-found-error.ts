import { AppError } from "./app-error";
import { ERROR_CODES } from "./error-codes";
import { HTTP_STATUS } from "../constants/http-status";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
    });
  }
}
