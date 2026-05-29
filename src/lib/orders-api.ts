import { apiGet, apiPatch } from "@/lib/api";

export type LiveOrder = {
  id: string;
  order_token: string;
  daily_number: number;
  type: "dine_in" | "takeaway";
  table_number: number | null;
  note: string | null;
  status: "new" | "preparing" | "ready" | "served" | "cancelled";
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    subtotal: number;
    modifiers: Array<{ group_name: string; option_name: string; price_adj: number }>;
  }>;
};

export type TodaySummary = {
  total_orders: number;
  total_revenue: number;
  orders_by_status: Record<string, number>;
};

export async function fetchLiveOrders() {
  return apiGet<{ orders: LiveOrder[] }>("/api/orders/live");
}

export async function fetchTodaySummary() {
  return apiGet<TodaySummary>("/api/orders/summary/today");
}

export async function updateOrderStatus(orderId: string, status: "preparing" | "ready" | "served") {
  return apiPatch<{ id: string; status: string }>(`/api/orders/${orderId}/status`, { status });
}

export async function cancelOrder(orderId: string, cancel_reason: string) {
  return apiPatch<{ id: string; status: string }>(`/api/orders/${orderId}/cancel`, {
    cancel_reason,
  });
}

export type OrderHistoryResult = {
  orders: LiveOrder[];
  total: number;
  page: number;
  pages: number;
};

export async function fetchOrderHistory(params: {
  page?: number;
  limit?: number;
  start?: string;
  end?: string;
  order_number?: number;
}) {
  return apiGet<OrderHistoryResult>("/api/orders/history", { params });
}
