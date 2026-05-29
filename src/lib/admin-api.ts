import { api, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export type PlatformStats = {
  total_cafes: number;
  active_subscriptions: number;
  pending_subscriptions: number;
  expired_subscriptions: number;
  suspended_owners: number;
  today_orders: number;
  today_revenue: number;
  attention_cafes: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
    owner: {
      email: string;
      full_name: string;
      status: string;
      selected_plan: string | null;
    };
    subscription: {
      status: string;
      plan: string;
      expires_at: string | null;
    } | null;
  }>;
};

export type AdminCafeRow = {
  id: string;
  name: string;
  slug: string;
  owner: { email: string; full_name: string; status: string };
  subscription: {
    status: string;
    plan: string;
    expires_at: string | null;
  } | null;
};

export type AdminCafeDetail = {
  cafe: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    status: string;
    profile_complete: boolean;
    menu_url: string;
    created_at: string;
  };
  owner: {
    id: string;
    email: string;
    full_name: string;
    status: string;
    email_verified: boolean;
    selected_plan: string | null;
    selected_billing_interval: string | null;
  };
  subscription: {
    id: string;
    status: string;
    starts_at: string | null;
    expires_at: string | null;
    notes: string | null;
    plan: {
      id: string;
      name: string;
      slug: string;
      price_monthly: number;
      price_yearly: number | null;
      entitlements: Record<string, boolean>;
      features: string[];
    };
  } | null;
  menu: { id: string; status: string; publishedAt: string | null } | null;
  order_count: number;
  served_order_count: number;
  staff_count: number;
};

export async function fetchAdminStats() {
  return apiGet<PlatformStats>("/api/admin/stats");
}

export async function fetchAdminCafes(params?: {
  page?: number;
  search?: string;
  status?: "active" | "suspended";
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.search && params.search.length >= 2) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<{ cafes: AdminCafeRow[]; total: number; page: number; pages: number }>(
    `/api/admin/cafes${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchAdminCafeDetail(cafeId: string) {
  return apiGet<AdminCafeDetail>(`/api/admin/cafes/${cafeId}`);
}

export async function updateCafeSubscription(
  cafeId: string,
  body: {
    status: string;
    plan_id?: string;
    plan_slug?: string;
    starts_at?: string | null;
    expires_at?: string | null;
    notes?: string | null;
  },
) {
  return apiPatch<{ subscription: unknown }>(`/api/admin/cafes/${cafeId}/subscription`, body);
}

export async function updateCafeAccountStatus(cafeId: string, status: "active" | "suspended") {
  return apiPatch<{ owner_status: string }>(`/api/admin/cafes/${cafeId}/account`, { status });
}

export async function startImpersonation(cafeId: string) {
  const { data } = await apiPost<{
    impersonation_token: string;
    cafe_id: string;
    owner_id: string;
    cafe_name: string;
    owner: import("@/stores/auth-store").OwnerSession;
  }>(`/api/admin/impersonate/${cafeId}`);
  return data;
}

export async function endImpersonation() {
  await apiDelete("/api/admin/impersonate");
}

export type AdminPlan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  entitlements: Record<string, boolean>;
  features: string[];
  is_active: boolean;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
};

export type PlanInput = {
  name: string;
  slug: string;
  price: number;
  price_yearly?: number | null;
  entitlements: Record<string, boolean>;
  features: string[];
  is_active: boolean;
};

export async function fetchAdminPlans(activeOnly = false) {
  return apiGet<{ plans: AdminPlan[] }>(
    `/api/admin/plans${activeOnly ? "?active=1" : ""}`,
  );
}

export async function createAdminPlan(body: PlanInput) {
  const { data } = await apiPost<{ plan: AdminPlan }>("/api/admin/plans", body);
  return data;
}

export async function updateAdminPlan(planId: string, body: Partial<PlanInput>) {
  return apiPatch<{ plan: AdminPlan }>(`/api/admin/plans/${planId}`, body);
}

export async function deleteAdminPlan(planId: string) {
  return apiDelete(`/api/admin/plans/${planId}`);
}

/** Restore admin Authorization header after impersonation */
export function setAdminAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
