import { api, apiGet } from "@/lib/api";

export type AnalyticsRange = "today" | "7days" | "30days" | "this_month" | "custom";

export type RangeParams = {
  range: AnalyticsRange;
  start?: string;
  end?: string;
};

export type AnalyticsSummary = {
  today_revenue: number;
  today_orders: number;
  month_revenue: number;
  month_orders: number;
};

export type DailyPoint = { date: string; revenue: number; orders: number };

export type PeakCell = { day: number; hour: number; count: number };

export async function fetchAnalyticsSummary() {
  return apiGet<AnalyticsSummary>("/api/analytics/summary");
}

export async function fetchDailyAnalytics(params: RangeParams) {
  return apiGet<{ days: DailyPoint[] }>("/api/analytics/daily", { params });
}

export async function fetchPeakHours(params: RangeParams) {
  return apiGet<{ grid: PeakCell[] }>("/api/analytics/peak-hours", { params });
}

export async function fetchTopItems(params: RangeParams) {
  return apiGet<{ items: Array<{ name: string; qty: number; revenue: number }> }>(
    "/api/analytics/top-items",
    { params },
  );
}

export async function fetchCategoryAnalytics(params: RangeParams) {
  return apiGet<{
    categories: Array<{ category_id: string; name: string; revenue: number; orders: number }>;
  }>("/api/analytics/categories", { params });
}

export async function fetchOrderTypeSplit(params: RangeParams) {
  return apiGet<{
    dine_in: { count: number; pct: number };
    takeaway: { count: number; pct: number };
  }>("/api/analytics/order-types", { params });
}

export async function downloadAnalyticsExport(params: RangeParams) {
  const { data } = await api.get<Blob>("/api/analytics/export", {
    params,
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${params.range}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
