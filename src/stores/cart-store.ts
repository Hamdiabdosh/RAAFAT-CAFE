import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModifierGroup } from "@/lib/menu-api";

export type CartModifierSelection = {
  group_id: string;
  group_name: string;
  options: Array<{ id: string; name: string; price_adj: number }>;
};

export type CartLine = {
  key: string;
  item_id: string;
  name: string;
  photo_url: string | null;
  base_price: number;
  quantity: number;
  unit_price: number;
  selected_modifiers: CartModifierSelection[];
};

function cartKey(itemId: string, selected: Record<string, string[]>) {
  const parts = Object.keys(selected)
    .sort()
    .flatMap((gid) => [...(selected[gid] ?? [])].sort().map((oid) => `${gid}:${oid}`));
  return `${itemId}|${parts.join(",")}`;
}

function storageKey(slug: string) {
  return `cafeos-cart-${slug}`;
}

type CartState = {
  slug: string | null;
  lines: CartLine[];
  loadForSlug: (slug: string) => void;
  addLine: (
    slug: string,
    item: {
      id: string;
      name: string;
      photo_url: string | null;
      base_price: number;
    },
    groups: ModifierGroup[],
    selected: Record<string, string[]>,
    unitPrice: number,
    quantity: number,
  ) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      slug: null,
      lines: [],
      loadForSlug(slug) {
        const raw = localStorage.getItem(storageKey(slug));
        const lines = raw ? (JSON.parse(raw) as CartLine[]) : [];
        set({ slug, lines });
      },
      addLine(slug, item, groups, selected, unitPrice, quantity) {
        const key = cartKey(item.id, selected);
        const selected_modifiers: CartModifierSelection[] = groups
          .map((g) => ({
            group_id: g.id,
            group_name: g.name,
            options: (selected[g.id] ?? [])
              .map((oid) => g.options.find((o) => o.id === oid))
              .filter(Boolean)
              .map((o) => ({ id: o!.id, name: o!.name, price_adj: o!.price_adj })),
          }))
          .filter((s) => s.options.length > 0);

        const { lines } = get();
        const existing = lines.find((l) => l.key === key);
        let next: CartLine[];
        if (existing) {
          next = lines.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
          );
        } else {
          next = [
            ...lines,
            {
              key,
              item_id: item.id,
              name: item.name,
              photo_url: item.photo_url,
              base_price: item.base_price,
              quantity,
              unit_price: unitPrice,
              selected_modifiers,
            },
          ];
        }
        localStorage.setItem(storageKey(slug), JSON.stringify(next));
        set({ slug, lines: next });
      },
      setQuantity(key, quantity) {
        const slug = get().slug;
        if (!slug) return;
        const next =
          quantity <= 0
            ? get().lines.filter((l) => l.key !== key)
            : get().lines.map((l) => (l.key === key ? { ...l, quantity } : l));
        localStorage.setItem(storageKey(slug), JSON.stringify(next));
        set({ lines: next });
      },
      removeLine(key) {
        get().setQuantity(key, 0);
      },
      clear() {
        const slug = get().slug;
        if (slug) localStorage.removeItem(storageKey(slug));
        set({ lines: [] });
      },
      total() {
        return get().lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
      },
      itemCount() {
        return get().lines.reduce((s, l) => s + l.quantity, 0);
      },
    }),
    {
      name: "cafeos-cart",
      partialize: (s) => ({ slug: s.slug, lines: s.lines }),
    },
  ),
);
