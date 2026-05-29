import { apiGet, apiPost } from "@/lib/api";
import type { DietaryTag, ModifierGroup, ModifierOption } from "@/lib/menu-api";
import type { CafeProfile } from "@/lib/cafe-api";

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  photo_url: string | null;
  availability: "available" | "sold_out";
  sort_order: number;
  dietary_tags: DietaryTag[];
  modifier_groups: ModifierGroup[];
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: PublicMenuItem[];
};

export type PublicMenuResponse =
  | {
      access: "open";
      cafe: CafeProfile;
      menu: { categories: PublicMenuCategory[] };
      ordering_enabled: boolean;
    }
  | {
      access: "closed";
      cafe: CafeProfile;
      menu: null;
      ordering_enabled: boolean;
    };

export type PlacedOrder = {
  id: string;
  order_token: string;
  daily_number: number;
  type: "dine_in" | "takeaway";
  table_number: number | null;
  note: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    item_name: string;
    base_price: number;
    quantity: number;
    subtotal: number;
    modifiers: Array<{ group_name: string; option_name: string; price_adj: number }>;
  }>;
};

export type OrderStatus = PlacedOrder & {
  cafe?: { name: string; slug: string; primary_color: string; bg_color: string };
};

export async function fetchPublicMenu(slug: string) {
  return apiGet<PublicMenuResponse>(`/api/public/menu/${slug}`);
}

export async function placePublicOrder(body: {
  cafe_id: string;
  type: "dine_in" | "takeaway";
  table_number?: number;
  note?: string;
  items: Array<{
    item_id: string;
    quantity: number;
    selected_modifiers: Array<{ group_id: string; option_ids: string[] }>;
  }>;
}) {
  const { data } = await apiPost<PlacedOrder>("/api/public/orders", body);
  return data;
}

export async function fetchOrderStatus(orderToken: string) {
  return apiGet<OrderStatus>(`/api/public/orders/${orderToken}`);
}

const moneyFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number) {
  return moneyFormatter.format(amount);
}

export type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  entitlements: Record<string, boolean>;
  features: string[];
};

export async function fetchPublicPlans() {
  return apiGet<{ plans: PublicPlan[] }>("/api/public/plans");
}

export function formatMoneyPerMonth(amount: number) {
  return `${formatMoney(amount)}/mo`;
}

export function formatMoneyPerYear(amount: number) {
  return `${formatMoney(amount)}/yr`;
}

export function modifierLineTotal(groups: ModifierGroup[], selected: Record<string, string[]>) {
  let total = 0;
  for (const group of groups) {
    const ids = selected[group.id] ?? [];
    for (const id of ids) {
      const opt = group.options.find((o) => o.id === id);
      if (opt) total += opt.price_adj;
    }
  }
  return total;
}

export function buildModifierPayload(
  groups: ModifierGroup[],
  selected: Record<string, string[]>,
): Array<{ group_id: string; option_ids: string[] }> {
  return groups
    .map((g) => ({ group_id: g.id, option_ids: selected[g.id] ?? [] }))
    .filter((s) => s.option_ids.length > 0);
}

export function modifiersValid(groups: ModifierGroup[], selected: Record<string, string[]>) {
  return groups.every((g) => !g.is_required || (selected[g.id]?.length ?? 0) > 0);
}

export type { ModifierOption };
