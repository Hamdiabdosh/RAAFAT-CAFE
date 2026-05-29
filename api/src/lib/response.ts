import type { Response } from "express";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code: number;
};

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function sendError(res: Response, error: string, code: number) {
  const body: ApiError = { success: false, error, code };
  return res.status(code).json(body);
}
