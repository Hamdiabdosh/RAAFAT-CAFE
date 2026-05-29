import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { emitOrderEvent } from "../../lib/socket.js";
import { getCafeOrderDate } from "../../lib/time.js";
import { getCafeByOwnerId } from "../cafe/cafe.service.js";
import type { cancelOrderSchema, historyQuerySchema, updateStatusSchema } from "./orders.schemas.js";
import type { z } from "zod";

type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
type CancelInput = z.infer<typeof cancelOrderSchema>;
type HistoryQuery = z.infer<typeof historyQuerySchema>;

const ACTIVE_STATUSES = ["new", "preparing", "ready"] as const;

function decimal(n: Prisma.Decimal | number): number {
  return typeof n === "number" ? n : Number(n);
}

function formatOrderListItem(order: {
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
    quantity: number;
    subtotal: Prisma.Decimal;
    modifiers: Array<{ groupName: string; optionName: string; priceAdj: Prisma.Decimal }>;
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
    items: order.items.map((oi) => ({
      id: oi.id,
      item_name: oi.itemName,
      quantity: oi.quantity,
      subtotal: decimal(oi.subtotal),
      modifiers: oi.modifiers.map((m) => ({
        group_name: m.groupName,
        option_name: m.optionName,
        price_adj: decimal(m.priceAdj),
      })),
    })),
  };
}

const orderInclude = {
  items: {
    include: { modifiers: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

async function getOwnerCafe(ownerId: string) {
  return getCafeByOwnerId(ownerId);
}

async function getOrderForCafe(orderId: string, cafeId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, cafeId, deletedAt: null },
    include: orderInclude,
  });
  if (!order) throw new NotFoundError("Order not found");
  return order;
}

const STATUS_FLOW: Record<string, string[]> = {
  new: ["preparing"],
  preparing: ["ready"],
  ready: ["served"],
};

export async function listLiveOrders(ownerId: string) {
  const cafe = await getOwnerCafe(ownerId);
  const orders = await prisma.order.findMany({
    where: {
      cafeId: cafe.id,
      deletedAt: null,
      status: { in: [...ACTIVE_STATUSES] },
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return { orders: orders.map(formatOrderListItem) };
}

export async function updateOrderStatus(ownerId: string, orderId: string, input: UpdateStatusInput) {
  const cafe = await getOwnerCafe(ownerId);
  const order = await getOrderForCafe(orderId, cafe.id);

  const allowed = STATUS_FLOW[order.status];
  if (!allowed?.includes(input.status)) {
    throw new ValidationError(`Cannot move from ${order.status} to ${input.status}`);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: input.status },
    include: orderInclude,
  });

  const payload = formatOrderListItem(updated);
  emitOrderEvent(cafe.id, updated.orderToken, "order:updated", payload);
  return { id: updated.id, status: updated.status };
}

export async function cancelOrder(ownerId: string, orderId: string, input: CancelInput) {
  const cafe = await getOwnerCafe(ownerId);
  const order = await getOrderForCafe(orderId, cafe.id);

  if (order.status === "served") {
    throw new ValidationError("Cannot cancel a served order");
  }
  if (order.status === "cancelled") {
    throw new ValidationError("Order is already cancelled");
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "cancelled",
      cancelReason: input.cancel_reason.trim(),
      cancelledBy: ownerId,
      deletedAt: new Date(),
    },
    include: orderInclude,
  });

  const payload = formatOrderListItem(updated);
  emitOrderEvent(cafe.id, updated.orderToken, "order:updated", payload);
  return { id: updated.id, status: updated.status };
}

export async function getOrderHistory(ownerId: string, query: HistoryQuery) {
  const cafe = await getOwnerCafe(ownerId);
  const where: Prisma.OrderWhereInput = {
    cafeId: cafe.id,
    status: { in: ["served", "cancelled"] },
    // Cancelled orders are soft-deleted but remain in history
  };

  if (query.order_number != null) {
    const orderDate = getCafeOrderDate(cafe.timezone);
    where.dailyNumber = query.order_number;
    where.orderDate = orderDate;
  }

  if (query.start || query.end) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.start) createdAt.gte = new Date(`${query.start}T00:00:00.000Z`);
    if (query.end) createdAt.lte = new Date(`${query.end}T23:59:59.999Z`);
    where.createdAt = createdAt;
  }

  const skip = (query.page - 1) * query.limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / query.limit));
  return {
    orders: orders.map(formatOrderListItem),
    total,
    page: query.page,
    pages,
  };
}

export async function getTodaySummary(ownerId: string) {
  const cafe = await getOwnerCafe(ownerId);
  const orderDate = getCafeOrderDate(cafe.timezone);

  const orders = await prisma.order.findMany({
    where: {
      cafeId: cafe.id,
      orderDate,
      deletedAt: null,
      status: { not: "cancelled" },
    },
    select: { status: true, totalAmount: true },
  });

  const ordersByStatus: Record<string, number> = {};
  let totalRevenue = 0;

  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    if (o.status === "served") {
      totalRevenue += decimal(o.totalAmount);
    }
  }

  return {
    total_orders: orders.length,
    total_revenue: totalRevenue,
    orders_by_status: ordersByStatus,
  };
}
