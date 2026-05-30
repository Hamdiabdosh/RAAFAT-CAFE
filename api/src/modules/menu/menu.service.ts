import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { getCafeByOwnerId } from "../cafe/cafe.service.js";
import {
  deleteFile,
  itemPhotoStorageKey,
  uploadFile,
  validateItemPhotoFile,
  type UploadedImage,
} from "../../lib/uploads.js";
import type {
  createItemSchema,
  modifierGroupSchema,
  modifierOptionSchema,
  updateItemSchema,
} from "./menu.schemas.js";
import type { z } from "zod";

type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;
type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;
type ModifierOptionInput = z.infer<typeof modifierOptionSchema>;

async function ownerContext(ownerId: string) {
  const cafe = await getCafeByOwnerId(ownerId);
  const menu = await prisma.menu.findUnique({
    where: { cafeId: cafe.id },
  });
  if (!menu) throw new NotFoundError("Menu not found");
  return { cafe, menu };
}

function decimal(n: number | Prisma.Decimal): number {
  return typeof n === "number" ? n : Number(n);
}

function formatOption(o: {
  id: string;
  name: string;
  priceAdj: Prisma.Decimal;
  sortOrder: number;
}) {
  return {
    id: o.id,
    name: o.name,
    price_adj: decimal(o.priceAdj),
    sort_order: o.sortOrder,
  };
}

function formatModifierGroup(g: {
  id: string;
  name: string;
  isRequired: boolean;
  isMulti: boolean;
  sortOrder: number;
  options: Array<{
    id: string;
    name: string;
    priceAdj: Prisma.Decimal;
    sortOrder: number;
  }>;
}) {
  return {
    id: g.id,
    name: g.name,
    is_required: g.isRequired,
    is_multi: g.isMulti,
    sort_order: g.sortOrder,
    options: g.options.map(formatOption),
  };
}

function formatItem(item: {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: Prisma.Decimal;
  photoUrl: string | null;
  availability: string;
  sortOrder: number;
  dietaryTags: Array<{ tag: { id: string; name: string } }>;
  modifierGroups: Array<{
    id: string;
    name: string;
    isRequired: boolean;
    isMulti: boolean;
    sortOrder: number;
    options: Array<{
      id: string;
      name: string;
      priceAdj: Prisma.Decimal;
      sortOrder: number;
    }>;
  }>;
}) {
  return {
    id: item.id,
    category_id: item.categoryId,
    name: item.name,
    description: item.description,
    base_price: decimal(item.basePrice),
    photo_url: item.photoUrl,
    availability: item.availability,
    sort_order: item.sortOrder,
    dietary_tags: item.dietaryTags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    modifier_groups: item.modifierGroups.map(formatModifierGroup),
  };
}

const itemInclude = {
  dietaryTags: { include: { tag: true } },
  modifierGroups: {
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
};

export async function getFullMenu(ownerId: string) {
  const { cafe, menu } = await ownerContext(ownerId);

  const categories = await prisma.category.findMany({
    where: { menuId: menu.id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: itemInclude,
      },
    },
  });

  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);

  return {
    menu: {
      id: menu.id,
      status: menu.status,
      published_at: menu.publishedAt,
      item_count: itemCount,
    },
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sortOrder,
      items: c.items.map(formatItem),
    })),
    cafe_id: cafe.id,
  };
}

export async function listDietaryTags() {
  return prisma.dietaryTag.findMany({ orderBy: { name: "asc" } });
}

export async function publishMenu(ownerId: string, status: "published" | "unpublished") {
  const { menu } = await ownerContext(ownerId);

  if (status === "published") {
    const count = await prisma.item.count({
      where: {
        cafeId: (await getCafeByOwnerId(ownerId)).id,
        deletedAt: null,
      },
    });
    if (count < 1) {
      throw new ValidationError("Add at least one item before publishing");
    }
  }

  const updated = await prisma.menu.update({
    where: { id: menu.id },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  return { status: updated.status, published_at: updated.publishedAt };
}

export async function createCategory(ownerId: string, name: string) {
  const { cafe, menu } = await ownerContext(ownerId);
  const max = await prisma.category.aggregate({
    where: { menuId: menu.id, deletedAt: null },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      menuId: menu.id,
      cafeId: cafe.id,
      name,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  return { id: category.id, name: category.name, sort_order: category.sortOrder, items: [] };
}

export async function updateCategory(ownerId: string, categoryId: string, name: string) {
  await assertCategoryOwner(ownerId, categoryId);
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: { name },
  });
  return { id: category.id, name: category.name, sort_order: category.sortOrder };
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  await assertCategoryOwner(ownerId, categoryId);
  const now = new Date();

  await prisma.$transaction([
    prisma.item.updateMany({
      where: { categoryId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: now },
    }),
  ]);

  return { deleted_items: await prisma.item.count({ where: { categoryId } }) };
}

export async function reorderCategories(
  ownerId: string,
  order: Array<{ id: string; sort_order: number }>,
) {
  const { menu } = await ownerContext(ownerId);
  const ids = order.map((o) => o.id);
  const owned = await prisma.category.count({
    where: { menuId: menu.id, id: { in: ids }, deletedAt: null },
  });
  if (owned !== ids.length) throw new ForbiddenError("Invalid category in reorder list");

  await prisma.$transaction(
    order.map((o) =>
      prisma.category.update({
        where: { id: o.id },
        data: { sortOrder: o.sort_order },
      }),
    ),
  );
}

export async function createItem(ownerId: string, input: CreateItemInput) {
  const { cafe } = await ownerContext(ownerId);
  await assertCategoryOwner(ownerId, input.category_id);

  const max = await prisma.item.aggregate({
    where: { categoryId: input.category_id, deletedAt: null },
    _max: { sortOrder: true },
  });

  const item = await prisma.item.create({
    data: {
      categoryId: input.category_id,
      cafeId: cafe.id,
      name: input.name,
      description: input.description ?? null,
      basePrice: input.base_price,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
      dietaryTags: input.dietary_tag_ids?.length
        ? {
            create: input.dietary_tag_ids.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: itemInclude,
  });

  return formatItem(item);
}

export async function getItem(ownerId: string, itemId: string) {
  const item = await assertItemOwner(ownerId, itemId);
  return formatItem(item);
}

export async function updateItem(ownerId: string, itemId: string, input: UpdateItemInput) {
  await assertItemOwner(ownerId, itemId);
  if (input.category_id) await assertCategoryOwner(ownerId, input.category_id);

  if (input.dietary_tag_ids) {
    await prisma.itemDietaryTag.deleteMany({ where: { itemId } });
    if (input.dietary_tag_ids.length > 0) {
      await prisma.itemDietaryTag.createMany({
        data: input.dietary_tag_ids.map((tagId) => ({ itemId, tagId })),
      });
    }
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(input.category_id !== undefined ? { categoryId: input.category_id } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.base_price !== undefined ? { basePrice: input.base_price } : {}),
    },
    include: itemInclude,
  });

  return formatItem(item);
}

export async function deleteItem(ownerId: string, itemId: string) {
  await assertItemOwner(ownerId, itemId);
  await prisma.item.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
  });
}

export async function setItemAvailability(
  ownerId: string,
  itemId: string,
  availability: "available" | "sold_out",
) {
  await assertItemOwner(ownerId, itemId);
  const item = await prisma.item.update({
    where: { id: itemId },
    data: { availability },
  });
  return { availability: item.availability };
}

export async function uploadItemPhoto(ownerId: string, itemId: string, file: UploadedImage) {
  validateItemPhotoFile(file);
  const item = await assertItemOwner(ownerId, itemId);
  const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
  const storageKey = itemPhotoStorageKey(itemId, ext);

  if (item.photoUrl) {
    await deleteFile(item.photoUrl);
  }

  const photoUrl = await uploadFile(file.buffer, storageKey, file.mimetype);
  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { photoUrl },
    include: itemInclude,
  });
  return formatItem(updated);
}

export async function createModifierGroup(
  ownerId: string,
  itemId: string,
  input: ModifierGroupInput,
) {
  const item = await assertItemOwner(ownerId, itemId);
  const max = await prisma.modifierGroup.aggregate({
    where: { itemId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const group = await prisma.modifierGroup.create({
    data: {
      itemId,
      cafeId: item.cafeId,
      name: input.name,
      isRequired: input.is_required,
      isMulti: input.is_multi,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
    include: { options: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
  });

  return formatModifierGroup(group);
}

export async function updateModifierGroup(
  ownerId: string,
  itemId: string,
  groupId: string,
  input: Partial<ModifierGroupInput>,
) {
  await assertModifierGroupOwner(ownerId, itemId, groupId);
  const group = await prisma.modifierGroup.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.is_required !== undefined ? { isRequired: input.is_required } : {}),
      ...(input.is_multi !== undefined ? { isMulti: input.is_multi } : {}),
    },
    include: { options: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
  });
  return formatModifierGroup(group);
}

export async function deleteModifierGroup(ownerId: string, itemId: string, groupId: string) {
  await assertModifierGroupOwner(ownerId, itemId, groupId);
  const now = new Date();
  await prisma.$transaction([
    prisma.modifierOption.updateMany({
      where: { groupId },
      data: { deletedAt: now },
    }),
    prisma.modifierGroup.update({
      where: { id: groupId },
      data: { deletedAt: now },
    }),
  ]);
}

export async function createModifierOption(
  ownerId: string,
  groupId: string,
  input: ModifierOptionInput,
) {
  await assertModifierGroupById(ownerId, groupId);
  const max = await prisma.modifierOption.aggregate({
    where: { groupId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const option = await prisma.modifierOption.create({
    data: {
      groupId,
      name: input.name,
      priceAdj: input.price_adj,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  return formatOption(option);
}

export async function updateModifierOption(
  ownerId: string,
  groupId: string,
  optionId: string,
  input: Partial<ModifierOptionInput>,
) {
  await assertModifierOptionOwner(ownerId, groupId, optionId);
  const option = await prisma.modifierOption.update({
    where: { id: optionId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price_adj !== undefined ? { priceAdj: input.price_adj } : {}),
    },
  });
  return formatOption(option);
}

export async function deleteModifierOption(
  ownerId: string,
  groupId: string,
  optionId: string,
) {
  await assertModifierOptionOwner(ownerId, groupId, optionId);
  const activeCount = await prisma.modifierOption.count({
    where: { groupId, deletedAt: null, id: { not: optionId } },
  });
  if (activeCount < 2) {
    throw new ValidationError("A modifier group must keep at least 2 options");
  }
  await prisma.modifierOption.update({
    where: { id: optionId },
    data: { deletedAt: new Date() },
  });
}

async function assertCategoryOwner(ownerId: string, categoryId: string) {
  const { menu } = await ownerContext(ownerId);
  const category = await prisma.category.findFirst({
    where: { id: categoryId, menuId: menu.id, deletedAt: null },
  });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

async function assertItemOwner(ownerId: string, itemId: string) {
  const cafe = await getCafeByOwnerId(ownerId);
  const item = await prisma.item.findFirst({
    where: { id: itemId, cafeId: cafe.id, deletedAt: null },
    include: itemInclude,
  });
  if (!item) throw new NotFoundError("Item not found");
  return item;
}

async function assertModifierGroupOwner(ownerId: string, itemId: string, groupId: string) {
  await assertItemOwner(ownerId, itemId);
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, itemId, deletedAt: null },
    include: { options: { where: { deletedAt: null } } },
  });
  if (!group) throw new NotFoundError("Modifier group not found");
  return group;
}

async function assertModifierGroupById(ownerId: string, groupId: string) {
  const cafe = await getCafeByOwnerId(ownerId);
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, cafeId: cafe.id, deletedAt: null },
  });
  if (!group) throw new NotFoundError("Modifier group not found");
  return group;
}

async function assertModifierOptionOwner(
  ownerId: string,
  groupId: string,
  optionId: string,
) {
  await assertModifierGroupById(ownerId, groupId);
  const option = await prisma.modifierOption.findFirst({
    where: { id: optionId, groupId, deletedAt: null },
  });
  if (!option) throw new NotFoundError("Modifier option not found");
  return option;
}
