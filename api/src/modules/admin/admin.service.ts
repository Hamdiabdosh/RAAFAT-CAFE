import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { signToken } from "../../lib/jwt.js";
import { menuPublicUrl } from "../cafe/cafe.service.js";
import { entitlementsFromPlan } from "../../lib/entitlements.js";
import type {
  createPlanSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
} from "./admin.schemas.js";
import type { z } from "zod";

type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
type CreatePlanInput = z.infer<typeof createPlanSchema>;
type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export async function updateCafeSubscription(
  cafeId: string,
  adminId: string,
  input: UpdateSubscriptionInput,
) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    include: {
      owner: { include: { subscription: true } },
      menu: true,
    },
  });

  if (!cafe) {
    throw new NotFoundError("Café not found");
  }

  if (cafe.owner.status === "suspended" && input.status === "active") {
    throw new ForbiddenError("Reactivate the café account before activating subscription");
  }

  if (input.status === "active" && !input.expires_at) {
    throw new ValidationError("Expiry date is required when activating a subscription");
  }

  if (input.expires_at && input.expires_at < startOfToday()) {
    throw new ValidationError("Expiry date must be today or in the future");
  }

  let planId = input.plan_id;
  let planSlug: string | undefined;
  if (!planId && input.plan_slug) {
    const plan = await prisma.plan.findUnique({ where: { slug: input.plan_slug } });
    if (!plan) throw new NotFoundError("Plan not found");
    planId = plan.id;
    planSlug = plan.slug;
  } else if (planId) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    planSlug = plan?.slug;
  }

  const subscription = cafe.owner.subscription;
  if (!subscription) {
    throw new NotFoundError("Subscription not found");
  }

  const startsAt =
    input.starts_at ??
    (input.status === "active" && !subscription.startsAt ? new Date() : subscription.startsAt);

  const updated = await prisma.$transaction(async (tx) => {
    if (planSlug) {
      await tx.cafeOwner.update({
        where: { id: cafe.ownerId },
        data: { selectedPlanSlug: planSlug },
      });
    }

    return tx.subscription.update({
      where: { id: subscription.id },
      data: {
        ...(planId ? { planId } : {}),
        status: input.status,
        startsAt,
        expiresAt: input.expires_at ?? subscription.expiresAt,
        notes: input.notes ?? subscription.notes,
        activatedBy: input.status === "active" ? adminId : subscription.activatedBy,
      },
      include: { plan: true },
    });
  });

  if (input.status === "expired" || input.status === "cancelled") {
    if (cafe.menu) {
      await prisma.menu.update({
        where: { id: cafe.menu.id },
        data: { status: "unpublished" },
      });
    }
  }

  return updated;
}

export async function updateOwnerAccountStatus(cafeId: string, status: "active" | "suspended") {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    include: { owner: true, menu: true },
  });

  if (!cafe) {
    throw new NotFoundError("Café not found");
  }

  await prisma.cafeOwner.update({
    where: { id: cafe.ownerId },
    data: { status: status === "active" ? "active" : "suspended" },
  });

  if (status === "suspended" && cafe.menu) {
    await prisma.menu.update({
      where: { id: cafe.menu.id },
      data: { status: "unpublished" },
    });
  }

  return { owner_status: status };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function decimal(n: Prisma.Decimal | number): number {
  return typeof n === "number" ? n : Number(n);
}

function formatSubscription(sub: {
  id: string;
  status: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  notes: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    price: Prisma.Decimal;
    priceYearly: Prisma.Decimal | null;
    entitlements: unknown;
    features: unknown;
  };
}) {
  return {
    id: sub.id,
    status: sub.status,
    starts_at: sub.startsAt,
    expires_at: sub.expiresAt,
    notes: sub.notes,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      slug: sub.plan.slug,
      price_monthly: decimal(sub.plan.price),
      price_yearly: sub.plan.priceYearly != null ? decimal(sub.plan.priceYearly) : null,
      entitlements: entitlementsFromPlan(sub.plan),
      features: normalizeFeatures(sub.plan.features),
    },
  };
}

function normalizeFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === "string");
  }
  return [];
}

function formatPlan(plan: {
  id: string;
  name: string;
  slug: string;
  price: Prisma.Decimal;
  priceYearly: Prisma.Decimal | null;
  entitlements: unknown;
  features: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price_monthly: decimal(plan.price),
    price_yearly: plan.priceYearly != null ? decimal(plan.priceYearly) : null,
    entitlements: entitlementsFromPlan(plan),
    features: normalizeFeatures(plan.features),
    is_active: plan.isActive,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

export async function listPlans(options?: { activeOnly?: boolean }) {
  const plans = await prisma.plan.findMany({
    where: options?.activeOnly ? { isActive: true } : undefined,
    orderBy: [{ isActive: "desc" }, { price: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return plans.map((p) => ({
    ...formatPlan(p),
    subscriber_count: p._count.subscriptions,
  }));
}

export async function createPlan(input: CreatePlanInput) {
  const existing = await prisma.plan.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ConflictError(`A plan with slug "${input.slug}" already exists`);
  }

  const plan = await prisma.plan.create({
    data: {
      name: input.name,
      slug: input.slug,
      price: input.price,
      priceYearly: input.price_yearly ?? null,
      entitlements: input.entitlements,
      features: input.features,
      isActive: input.is_active,
    },
  });

  return formatPlan(plan);
}

export async function updatePlan(planId: string, input: UpdatePlanInput) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  if (input.slug && input.slug !== plan.slug) {
    const clash = await prisma.plan.findUnique({ where: { slug: input.slug } });
    if (clash) {
      throw new ConflictError(`A plan with slug "${input.slug}" already exists`);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.plan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.price_yearly !== undefined ? { priceYearly: input.price_yearly } : {}),
        ...(input.entitlements !== undefined ? { entitlements: input.entitlements } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.is_active !== undefined ? { isActive: input.is_active } : {}),
      },
    });

    // Keep owners' selected plan reference in sync when the slug changes.
    if (input.slug !== undefined && input.slug !== plan.slug) {
      await tx.cafeOwner.updateMany({
        where: { selectedPlanSlug: plan.slug },
        data: { selectedPlanSlug: input.slug },
      });
    }

    return result;
  });

  return formatPlan(updated);
}

export async function deletePlan(planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { _count: { select: { subscriptions: true } } },
  });
  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  if (plan._count.subscriptions > 0) {
    throw new ConflictError(
      "This plan is assigned to one or more cafés. Deactivate it instead of deleting.",
    );
  }

  await prisma.plan.delete({ where: { id: planId } });
  return { deleted: true };
}

export async function getPlatformStats() {
  const todayStart = startOfToday();

  const [
    totalCafes,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    suspendedOwners,
    todayOrders,
    todayRevenueAgg,
    attentionCafes,
  ] = await Promise.all([
    prisma.cafe.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: "pending" } }),
    prisma.subscription.count({ where: { status: "expired" } }),
    prisma.cafeOwner.count({ where: { status: "suspended" } }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart }, deletedAt: null, status: { not: "cancelled" } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: "served", deletedAt: null },
      _sum: { totalAmount: true },
    }),
    prisma.cafe.findMany({
      where: {
        owner: {
          status: { not: "suspended" },
          subscription: { status: { in: ["pending", "expired"] } },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            email: true,
            fullName: true,
            status: true,
            selectedPlanSlug: true,
            subscription: { include: { plan: true } },
          },
        },
      },
    }),
  ]);

  return {
    total_cafes: totalCafes,
    active_subscriptions: activeSubscriptions,
    pending_subscriptions: pendingSubscriptions,
    expired_subscriptions: expiredSubscriptions,
    suspended_owners: suspendedOwners,
    today_orders: todayOrders,
    today_revenue: decimal(todayRevenueAgg._sum.totalAmount ?? 0),
    attention_cafes: attentionCafes.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      created_at: c.createdAt,
      owner: {
        email: c.owner.email,
        full_name: c.owner.fullName,
        status: c.owner.status,
        selected_plan: c.owner.selectedPlanSlug,
      },
      subscription: c.owner.subscription
        ? {
            status: c.owner.subscription.status,
            plan: c.owner.subscription.plan.name,
            expires_at: c.owner.subscription.expiresAt,
          }
        : null,
    })),
  };
}

export async function getCafeDetail(cafeId: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    include: {
      owner: { include: { subscription: { include: { plan: true } } } },
      menu: { select: { id: true, status: true, publishedAt: true } },
      _count: { select: { orders: true, staff: true } },
    },
  });

  if (!cafe) throw new NotFoundError("Café not found");

  const servedCount = await prisma.order.count({
    where: { cafeId, status: "served" },
  });

  return {
    cafe: {
      id: cafe.id,
      name: cafe.name,
      slug: cafe.slug,
      description: cafe.description,
      address: cafe.address,
      phone: cafe.phone,
      status: cafe.status,
      profile_complete: cafe.profileComplete,
      menu_url: menuPublicUrl(cafe.slug),
      created_at: cafe.createdAt,
    },
    owner: {
      id: cafe.owner.id,
      email: cafe.owner.email,
      full_name: cafe.owner.fullName,
      status: cafe.owner.status,
      email_verified: cafe.owner.emailVerified,
      selected_plan: cafe.owner.selectedPlanSlug,
      selected_billing_interval: cafe.owner.selectedBillingInterval,
    },
    subscription: cafe.owner.subscription
      ? formatSubscription(cafe.owner.subscription)
      : null,
    menu: cafe.menu,
    order_count: cafe._count.orders,
    served_order_count: servedCount,
    staff_count: cafe._count.staff,
  };
}

export async function startImpersonation(adminId: string, cafeId: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    include: {
      owner: { include: { subscription: true } },
    },
  });

  if (!cafe) throw new NotFoundError("Café not found");
  if (cafe.owner.status === "suspended") {
    throw new ForbiddenError("Cannot impersonate a suspended account");
  }
  if (!cafe.owner.emailVerified) {
    throw new ForbiddenError("Owner has not verified their email");
  }

  await prisma.impersonationLog.updateMany({
    where: { adminId, cafeId, endedAt: null },
    data: { endedAt: new Date() },
  });

  await prisma.impersonationLog.create({
    data: { adminId, cafeId },
  });

  const impersonation_token = signToken({
    sub: cafe.owner.id,
    role: "owner",
    cafeId: cafe.id,
    impersonating: true,
  });

  return {
    impersonation_token,
    cafe_id: cafe.id,
    owner_id: cafe.owner.id,
    cafe_name: cafe.name,
    owner: {
      id: cafe.owner.id,
      email: cafe.owner.email,
      full_name: cafe.owner.fullName,
      email_verified: cafe.owner.emailVerified,
      status: cafe.owner.status,
      cafe_id: cafe.id,
      selected_plan: cafe.owner.selectedPlanSlug,
      selected_billing_interval: cafe.owner.selectedBillingInterval,
      subscription_status: cafe.owner.subscription?.status ?? "pending",
    },
  };
}

export async function endImpersonation(ownerId: string) {
  const open = await prisma.impersonationLog.findFirst({
    where: { endedAt: null, cafe: { ownerId } },
    orderBy: { startedAt: "desc" },
  });

  if (open) {
    await prisma.impersonationLog.update({
      where: { id: open.id },
      data: { endedAt: new Date() },
    });
  }

  return { ended: Boolean(open) };
}
