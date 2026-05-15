import { NextResponse } from "next/server";
import { HTTP_STATUS } from "../constants/http-status";
import type { ErrorCode } from "../errors/error-codes";
import type { ApiError, ApiSuccess } from "../types/api";

type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const ok = <TData>(
  message: string,
  data: TData,
  status: HttpStatusCode = HTTP_STATUS.OK
): NextResponse<ApiSuccess<TData>> =>
  NextResponse.json({ success: true, message, data }, { status });

export const created = <TData>(
  message: string,
  data: TData
): NextResponse<ApiSuccess<TData>> => ok(message, data, HTTP_STATUS.CREATED);

export const fail = (
  message: string,
  errorCode: ErrorCode,
  details?: unknown,
  status: HttpStatusCode = HTTP_STATUS.BAD_REQUEST
): NextResponse<ApiError> =>
  NextResponse.json({ success: false, message, errorCode, details }, { status });
