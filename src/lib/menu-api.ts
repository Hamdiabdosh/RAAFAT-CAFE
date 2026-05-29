import { api, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export type DietaryTag = { id: string; name: string };

export type ModifierOption = {
  id: string;
  name: string;
  price_adj: number;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  is_required: boolean;
  is_multi: boolean;
  sort_order: number;
  options: ModifierOption[];
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  photo_url: string | null;
  availability: "available" | "sold_out";
  sort_order: number;
  dietary_tags: DietaryTag[];
  modifier_groups: ModifierGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
};

export type FullMenu = {
  menu: {
    id: string;
    status: "draft" | "published" | "unpublished";
    published_at: string | null;
    item_count: number;
  };
  categories: MenuCategory[];
};

export async function fetchMenu() {
  return apiGet<FullMenu>("/api/menu");
}

export async function fetchDietaryTags() {
  return apiGet<{ tags: DietaryTag[] }>("/api/menu/tags");
}

export async function publishMenu(status: "published" | "unpublished") {
  return apiPatch<{ status: string }>("/api/menu/publish", { status });
}

export async function createCategory(name: string) {
  return apiPost<{ category: MenuCategory }>("/api/menu/categories", { name });
}

export async function updateCategory(id: string, name: string) {
  return apiPatch<{ category: MenuCategory }>(`/api/menu/categories/${id}`, { name });
}

export async function deleteCategory(id: string) {
  await apiDelete(`/api/menu/categories/${id}`);
}

export async function createMenuItem(body: {
  category_id: string;
  name: string;
  description?: string | null;
  base_price: number;
  dietary_tag_ids?: string[];
}) {
  return apiPost<{ item: MenuItem }>("/api/menu/items", body);
}

export async function updateMenuItem(
  id: string,
  body: {
    category_id?: string;
    name?: string;
    description?: string | null;
    base_price?: number;
    dietary_tag_ids?: string[];
  },
) {
  return apiPatch<{ item: MenuItem }>(`/api/menu/items/${id}`, body);
}

export async function deleteMenuItem(id: string) {
  await apiDelete(`/api/menu/items/${id}`);
}

export async function setItemAvailability(id: string, availability: "available" | "sold_out") {
  return apiPatch<{ availability: string }>(`/api/menu/items/${id}/availability`, {
    availability,
  });
}

export async function uploadItemPhoto(itemId: string, file: File) {
  const form = new FormData();
  form.append("photo", file);
  const { data } = await api.post<{ success: true; data: { item: MenuItem } }>(
    `/api/menu/items/${itemId}/photo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data.item;
}

export async function createModifierGroup(
  itemId: string,
  body: { name: string; is_required: boolean; is_multi: boolean },
) {
  return apiPost<{ modifier_group: ModifierGroup }>(`/api/menu/items/${itemId}/modifiers`, body);
}

export async function createModifierOption(
  groupId: string,
  body: { name: string; price_adj: number },
) {
  return apiPost<{ option: ModifierOption }>(`/api/menu/modifiers/${groupId}/options`, body);
}

export async function deleteModifierGroup(itemId: string, groupId: string) {
  await apiDelete(`/api/menu/items/${itemId}/modifiers/${groupId}`);
}

export async function deleteModifierOption(groupId: string, optionId: string) {
  await apiDelete(`/api/menu/modifiers/${groupId}/options/${optionId}`);
}
