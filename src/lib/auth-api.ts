import { apiGet, apiPost } from "@/lib/api";
import type { OwnerSession } from "@/stores/auth-store";

export async function registerOwner(payload: {
  full_name: string;
  email: string;
  password: string;
  cafe_name: string;
}) {
  return apiPost<{ owner_id: string; email: string }>("/api/auth/register", payload);
}

export async function loginOwner(payload: { email: string; password: string }) {
  return apiPost<{ access_token: string; owner: OwnerSession }>("/api/auth/login", payload);
}

export async function verifyEmailToken(token: string) {
  const data = await apiGet<{ verified: boolean; already_verified?: boolean }>(
    `/api/auth/verify/${token}`,
  );
  return { data };
}

export async function resendVerification(email: string) {
  return apiPost<null>("/api/auth/resend-verification", { email });
}

export async function forgotPassword(email: string) {
  return apiPost<null>("/api/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string) {
  return apiPost<null>(`/api/auth/reset-password/${token}`, { password });
}

export async function selectPlan(plan: string, billing_interval: "monthly" | "yearly" = "monthly") {
  return apiPost<{ plan: string; billing_interval: string; status: string }>(
    "/api/auth/select-plan",
    { plan, billing_interval },
  );
}

export async function adminLogin(payload: { email: string; password: string }) {
  return apiPost<{ access_token: string; admin: { id: string; email: string } }>(
    "/api/admin/auth/login",
    payload,
  );
}
