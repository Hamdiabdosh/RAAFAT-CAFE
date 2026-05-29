import axios, { type AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error: string;
  code: number;
};

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiFailure | undefined;
    if (data?.error) return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function apiGet<T>(
  url: string,
  config?: { params?: Record<string, string | number | undefined> },
): Promise<T> {
  const { data } = await api.get<ApiSuccess<T>>(url, config);
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<{ data: T; message?: string }> {
  const { data } = await api.post<ApiSuccess<T>>(url, body);
  return { data: data.data, message: data.message };
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiSuccess<T>>(url, body);
  return data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await api.delete(url);
}

export type { AxiosError };
