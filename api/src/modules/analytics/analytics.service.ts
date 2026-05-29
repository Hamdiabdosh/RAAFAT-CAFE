import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ValidationError } from "../../lib/errors.js";
import { getCafeOrderDate } from "../../lib/time.js";
import { getCafeByOwnerId } from "../cafe/cafe.service.js";
import type { AnalyticsRangeQuery } from "./analytics.schemas.js";

const MAX_RANGE_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function decimal(n: Prisma.Decimal | number): number {
  return typeof n === "number" ? n : Number(n);
}

function datePartsInTz(timezone: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return { y, m, d, iso: `${y}-${m}-${d}` };
}

function utcDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function addDays(iso: string, days: number) {
  const d = utcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(startIso: string, endIso: string) {
  const diff = utcDate(endIso).getTime() - utcDate(startIso).getTime();
  return Math.floor(diff / DAY_MS) + 1;
}

export function resolveRange(
  timezone: string,
  query: AnalyticsRangeQuery,
): { start: Date; end: Date; startIso: string; endIso: string } {
  const today = datePartsInTz(timezone).iso;
  let startIso = today;
  let endIso = today;

  switch (query.range) {
    case "today":
      break;
    case "7days":
      startIso = addDays(today, -6);
      break;
    case "30days":
      startIso = addDays(today, -29);
      break;
    case "this_month": {
      const { y, m } = datePartsInTz(timezone);
      startIso = `${y}-${m}-01`;
      break;
    }
    case "custom": {
      if (!query.start || !query.end) {
        throw new ValidationError("Custom range requires start and end dates");
      }
      startIso = query.start;
      endIso = query.end;
      if (utcDate(endIso) < utcDate(startIso)) {
        throw new ValidationError("End date must be on or after start date");
      }
      const span = daysBetween(startIso, endIso);
      if (span > MAX_RANGE_DAYS) {
        throw new ValidationError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
      }
      const nowParts = datePartsInTz(timezone);
      if (utcDate(endIso) > utcDate(nowParts.iso)) {
        throw new ValidationError("End date cannot be in the future");
      }
      break;
    }
  }

  const start = utcDate(startIso);
  const end = new Date(utcDate(endIso).getTime() + DAY_MS - 1);
  return { start, end, startIso, endIso };
}

function servedWhere(cafeId: string, start: Date, end: Date): Prisma.OrderWhereInput {
  return {
    cafeId,
    status: "served",
    createdAt: { gte: start, lte: end },
  };
}

async function cafeForOwner(ownerId: string) {
  return getCafeByOwnerId(ownerId);
}

export async function getSummary(ownerId: string) {
  const cafe = await cafeForOwner(ownerId);
  const orderDate = getCafeOrderDate(cafe.timezone);
  const { y, m } = datePartsInTz(cafe.timezone);
  const monthStart = utcDate(`${y}-${m}-01`);
  const monthEnd = new Date();

  const [todayAgg, monthAgg] = await Promise.all([
    prisma.order.aggregate({
      where: { cafeId: cafe.id, status: "served", orderDate },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        cafeId: cafe.id,
        status: "served",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    today_revenue: decimal(todayAgg._sum.totalAmount ?? 0),
    today_orders: todayAgg._count,
    month_revenue: decimal(monthAgg._sum.totalAmount ?? 0),
    month_orders: monthAgg._count,
  };
}

export async function getDaily(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end, startIso, endIso } = resolveRange(cafe.timezone, query);

  const orders = await prisma.order.findMany({
    where: servedWhere(cafe.id, start, end),
    select: { orderDate: true, totalAmount: true },
    orderBy: { orderDate: "asc" },
  });

  const byDate = new Map<string, { revenue: number; orders: number }>();
  for (let d = startIso; d <= endIso; d = addDays(d, 1)) {
    byDate.set(d, { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.orderDate.toISOString().slice(0, 10);
    const row = byDate.get(key);
    if (!row) continue;
    row.revenue += decimal(o.totalAmount);
    row.orders += 1;
  }

  return {
    days: [...byDate.entries()].map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders,
    })),
  };
}

export async function getPeakHours(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end } = resolveRange(cafe.timezone, query);

  const orders = await prisma.order.findMany({
    where: servedWhere(cafe.id, start, end),
    select: { createdAt: true },
  });

  const grid: Array<{ day: number; hour: number; count: number }> = [];
  const counts = new Map<string, number>();

  for (const o of orders) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: cafe.timezone,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    }).formatToParts(o.createdAt);
    const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const day = dayMap[wd] ?? 0;
    const key = `${day}-${hour}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      grid.push({ day, hour, count: counts.get(`${day}-${hour}`) ?? 0 });
    }
  }

  return { grid };
}

export async function getTopItems(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end } = resolveRange(cafe.timezone, query);

  const rows = await prisma.orderItem.groupBy({
    by: ["itemName"],
    where: { order: servedWhere(cafe.id, start, end) },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  return {
    items: rows.map((r) => ({
      item_id: null,
      name: r.itemName,
      qty: r._sum.quantity ?? 0,
      revenue: decimal(r._sum.subtotal ?? 0),
    })),
  };
}

export async function getCategories(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end } = resolveRange(cafe.timezone, query);

  const lines = await prisma.orderItem.findMany({
    where: { order: servedWhere(cafe.id, start, end) },
    select: {
      subtotal: true,
      item: { select: { category: { select: { id: true, name: true } } } },
    },
  });

  const map = new Map<string, { category_id: string; name: string; revenue: number; orders: number }>();
  for (const line of lines) {
    const cat = line.item?.category;
    const key = cat?.id ?? "uncategorized";
    const name = cat?.name ?? "Uncategorized";
    const row = map.get(key) ?? { category_id: key, name, revenue: 0, orders: 0 };
    row.revenue += decimal(line.subtotal);
    row.orders += 1;
    map.set(key, row);
  }

  return {
    categories: [...map.values()]
      .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

export async function getOrderTypes(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end } = resolveRange(cafe.timezone, query);

  const grouped = await prisma.order.groupBy({
    by: ["type"],
    where: servedWhere(cafe.id, start, end),
    _count: true,
  });

  let dineIn = 0;
  let takeaway = 0;
  for (const g of grouped) {
    if (g.type === "dine_in") dineIn = g._count;
    else takeaway = g._count;
  }
  const total = dineIn + takeaway;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  return {
    dine_in: { count: dineIn, pct: pct(dineIn) },
    takeaway: { count: takeaway, pct: pct(takeaway) },
  };
}

export async function exportOrdersCsv(ownerId: string, query: AnalyticsRangeQuery) {
  const cafe = await cafeForOwner(ownerId);
  const { start, end } = resolveRange(cafe.timezone, query);

  const orders = await prisma.order.findMany({
    where: servedWhere(cafe.id, start, end),
    select: {
      dailyNumber: true,
      orderDate: true,
      type: true,
      tableNumber: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "order_number,date,type,table,total,created_at\n";
  const rows = orders
    .map((o) => {
      const date = o.orderDate.toISOString().slice(0, 10);
      const table = o.tableNumber ?? "";
      return `${o.dailyNumber},${date},${o.type},${table},${decimal(o.totalAmount)},${o.createdAt.toISOString()}`;
    })
    .join("\n");

  return header + rows;
}
