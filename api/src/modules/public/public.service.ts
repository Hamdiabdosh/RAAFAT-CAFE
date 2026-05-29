import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
  ValidationError,
} from "../../lib/errors.js";
import { emitOrderEvent } from "../../lib/socket.js";
import { getCafeOrderDate } from "../../lib/time.js";
import { formatCafeResponse } from "../cafe/cafe.service.js";
import {
  entitlementsFromPlan,
  hasEntitlement,
} from "../../lib/entitlements.js";
import { isSubscriptionActive } from "../../middleware/subscription-gate.js";
import type { placeOrderSchema } from "./public.schemas.js";
import type { z } from "zod";

type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

function normalizeMarketingFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === "string");
  }
  return [];
}

function formatPublicPlan(p: {
  id: string;
  name: string;
  slug: string;
  price: Prisma.Decimal;
  priceYearly: Prisma.Decimal | null;
  entitlements: unknown;
  features: unknown;
}) {
  const entitlements = entitlementsFromPlan(p);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_monthly: Number(p.price),
    price_yearly: p.priceYearly != null ? Number(p.priceYearly) : null,
    entitlements,
    features: normalizeMarketingFeatures(p.features),
  };
}

export async function listActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return plans.map(formatPublicPlan);
}

function decimal(n: Prisma.Decimal | number): number {
  return typeof n === "number" ? n : Number(n);
}

const publicItemInclude = {
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
} satisfies Prisma.ItemInclude;

function formatPublicItem(item: {
  id: string;
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
    name: item.name,
    description: item.description,
    base_price: decimal(item.basePrice),
    photo_url: item.photoUrl,
    availability: item.availability,
    sort_order: item.sortOrder,
    dietary_tags: item.dietaryTags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    modifier_groups: item.modifierGroups.map((g) => ({
      id: g.id,
      name: g.name,
      is_required: g.isRequired,
      is_multi: g.isMulti,
      sort_order: g.sortOrder,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        price_adj: decimal(o.priceAdj),
        sort_order: o.sortOrder,
      })),
    })),
  };
}

async function loadCafeBySlug(slug: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { slug },
    include: {
      owner: { include: { subscription: { include: { plan: true } } } },
      operatingHours: { orderBy: { dayOfWeek: "asc" } },
      menu: {
        include: {
          categories: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              items: {
                where: { deletedAt: null },
                orderBy: { sortOrder: "asc" },
                include: publicItemInclude,
              },
            },
          },
        },
      },
    },
  });
  if (!cafe) throw new NotFoundError("Café not found");
  return cafe;
}

export async function getPublicMenu(slug: string) {
  const cafe = await loadCafeBySlug(slug);
  const sub = cafe.owner.subscription;

  if (!isSubscriptionActive(sub)) {
    throw new PaymentRequiredError();
  }

  const plan = sub?.plan;
  if (!plan) {
    throw new PaymentRequiredError();
  }

  const entitlements = entitlementsFromPlan(plan);
  if (!hasEntitlement(entitlements, "menu_display")) {
    throw new ForbiddenError("Menu is not available for this café");
  }

  const orderingEnabled =
    isSubscriptionActive(sub) && hasEntitlement(entitlements, "customer_ordering");

  if (!cafe.menu || cafe.menu.status !== "published") {
    throw new ForbiddenError("Menu is not published");
  }

  const cafePayload = formatCafeResponse(cafe);

  if (cafe.status !== "open") {
    return {
      access: "closed" as const,
      cafe: cafePayload,
      menu: null,
      ordering_enabled: false,
    };
  }

  const categories = cafe.menu.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sort_order: cat.sortOrder,
    items: cat.items.map(formatPublicItem),
  }));

  return {
    access: "open" as const,
    cafe: cafePayload,
    menu: { categories },
    ordering_enabled: orderingEnabled,
  };
}

function formatOrderItem(oi: {
  id: string;
  itemName: string;
  basePrice: Prisma.Decimal;
  quantity: number;
  subtotal: Prisma.Decimal;
  modifiers: Array<{
    groupName: string;
    optionName: string;
    priceAdj: Prisma.Decimal;
  }>;
}) {
  return {
    id: oi.id,
    item_name: oi.itemName,
    base_price: decimal(oi.basePrice),
    quantity: oi.quantity,
    subtotal: decimal(oi.subtotal),
    modifiers: oi.modifiers.map((m) => ({
      group_name: m.groupName,
      option_name: m.optionName,
      price_adj: decimal(m.priceAdj),
    })),
  };
}

function formatOrderResponse(order: {
  id: string;
  orderToken: string;
  dailyNumber: number;
  type: string;
  tableNumber: number | null;
  note: string | null;
  status: string;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
  items: Array<{
    id: string;
    itemName: string;
    basePrice: Prisma.Decimal;
    quantity: number;
    subtotal: Prisma.Decimal;
    modifiers: Array<{
      groupName: string;
      optionName: string;
      priceAdj: Prisma.Decimal;
    }>;
  }>;
}) {
  return {
    id: order.id,
    order_token: order.orderToken,
    daily_number: order.dailyNumber,
    type: order.type,
    table_number: order.tableNumber,
    note: order.note,
    status: order.status,
    total_amount: decimal(order.totalAmount),
    created_at: order.createdAt.toISOString(),
    items: order.items.map(formatOrderItem),
  };
}

export async function placeOrder(input: PlaceOrderInput) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: input.cafe_id },
    include: {
      owner: { include: { subscription: { include: { plan: true } } } },
      menu: true,
    },
  });
  if (!cafe) throw new NotFoundError("Café not found");

  const sub = cafe.owner.subscription;
  if (!isSubscriptionActive(sub)) {
    throw new PaymentRequiredError();
  }

  const plan = sub?.plan;
  if (!plan) {
    throw new PaymentRequiredError();
  }

  const entitlements = entitlementsFromPlan(plan);
  if (!hasEntitlement(entitlements, "customer_ordering")) {
    throw new ForbiddenError("Online ordering is not available for this café");
  }

  if (!cafe.menu || cafe.menu.status !== "published") {
    throw new ForbiddenError("Menu is not published");
  }

  if (cafe.status !== "open") {
    throw new ValidationError("This café is currently closed");
  }

  const itemIds = input.items.map((i) => i.item_id);
  const dbItems = await prisma.item.findMany({
    where: {
      id: { in: itemIds },
      cafeId: cafe.id,
      deletedAt: null,
      category: { deletedAt: null, menuId: cafe.menu.id },
    },
    include: publicItemInclude,
  });

  const itemMap = new Map(dbItems.map((i) => [i.id, i]));

  type LineInput = {
    item: (typeof dbItems)[0];
    quantity: number;
    selected: Array<{ group_id: string; option_ids: string[] }>;
  };
  const lines: LineInput[] = [];

  for (const line of input.items) {
    const item = itemMap.get(line.item_id);
    if (!item) {
      throw new NotFoundError(`Item not found: ${line.item_id}`);
    }
    if (item.availability === "sold_out") {
      throw new ConflictError(`${item.name} is sold out`);
    }
    lines.push({ item, quantity: line.quantity, selected: line.selected_modifiers });
  }

  const orderItemsData: Array<{
    itemId: string;
    itemName: string;
    basePrice: Prisma.Decimal;
    quantity: number;
    subtotal: Prisma.Decimal;
    modifiers: Array<{ groupName: string; optionName: string; priceAdj: Prisma.Decimal }>;
  }> = [];

  for (const line of lines) {
    const { item, quantity, selected } = line;
    const groups = item.modifierGroups;
    const selectedGroupIds = new Set(selected.map((s) => s.group_id));

    for (const group of groups) {
      if (group.isRequired && !selectedGroupIds.has(group.id)) {
        throw new ValidationError(`Required modifier missing: ${group.name}`);
      }
    }

    let modifierTotal = 0;
    const modifiers: Array<{ groupName: string; optionName: string; priceAdj: Prisma.Decimal }> =
      [];

    for (const sel of selected) {
      const group = groups.find((g) => g.id === sel.group_id);
      if (!group) {
        throw new ValidationError("Invalid modifier group");
      }
      if (!group.isMulti && sel.option_ids.length > 1) {
        throw new ValidationError(`${group.name} allows only one option`);
      }
      for (const optId of sel.option_ids) {
        const opt = group.options.find((o) => o.id === optId);
        if (!opt) {
          throw new ValidationError(`Invalid option for ${group.name}`);
        }
        modifierTotal += decimal(opt.priceAdj);
        modifiers.push({
          groupName: group.name,
          optionName: opt.name,
          priceAdj: opt.priceAdj,
        });
      }
    }

    const unitPrice = decimal(item.basePrice) + modifierTotal;
    const subtotal = unitPrice * quantity;

    orderItemsData.push({
      itemId: item.id,
      itemName: item.name,
      basePrice: item.basePrice,
      quantity,
      subtotal: new Prisma.Decimal(subtotal),
      modifiers,
    });
  }

  const totalAmount = orderItemsData.reduce((sum, o) => sum + decimal(o.subtotal), 0);
  const orderToken = randomUUID();
  const orderDate = getCafeOrderDate(cafe.timezone);

  const order = await prisma.$transaction(async (tx) => {
    const max = await tx.order.aggregate({
      where: { cafeId: cafe.id, orderDate },
      _max: { dailyNumber: true },
    });
    const dailyNumber = (max._max.dailyNumber ?? 0) + 1;

    return tx.order.create({
      data: {
        cafeId: cafe.id,
        orderToken,
        dailyNumber,
        orderDate,
        type: input.type,
        tableNumber: input.type === "dine_in" ? input.table_number : null,
        note: input.note?.trim() || null,
        totalAmount: new Prisma.Decimal(totalAmount),
        items: {
          create: orderItemsData.map((oi) => ({
            itemId: oi.itemId,
            itemName: oi.itemName,
            basePrice: oi.basePrice,
            quantity: oi.quantity,
            subtotal: oi.subtotal,
            modifiers: {
              create: oi.modifiers.map((m) => ({
                groupName: m.groupName,
                optionName: m.optionName,
                priceAdj: m.priceAdj,
              })),
            },
          })),
        },
      },
      include: {
        items: { include: { modifiers: true } },
      },
    });
  });

  const payload = formatOrderResponse(order);
  emitOrderEvent(cafe.id, order.orderToken, "order:new", payload);
  return payload;
}

export async function getOrderByToken(orderToken: string) {
  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: {
      items: { include: { modifiers: true } },
      cafe: { select: { name: true, slug: true, primaryColor: true, bgColor: true } },
    },
  });
  if (!order || order.deletedAt) throw new NotFoundError("Order not found");

  return {
    ...formatOrderResponse(order),
    cafe: {
      name: order.cafe.name,
      slug: order.cafe.slug,
      primary_color: order.cafe.primaryColor,
      bg_color: order.cafe.bgColor,
    },
  };
}
