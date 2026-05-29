import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  type EntitlementKey,
  entitlementsFromPlan,
  hasEntitlement,
} from "../lib/entitlements.js";
import { ForbiddenError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "./auth.js";

export function requireEntitlement(feature: EntitlementKey) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "owner" || !req.user.sub) {
        throw new ForbiddenError("Owner access required");
      }

      const owner = await prisma.cafeOwner.findUnique({
        where: { id: req.user.sub },
        include: {
          subscription: { include: { plan: true } },
        },
      });

      if (!owner?.subscription) {
        throw new ForbiddenError("No subscription");
      }

      const { subscription } = owner;

      if (subscription.status !== "active") {
        throw new ForbiddenError(
          subscription.status === "expired"
            ? "Subscription expired"
            : "Subscription not active",
        );
      }

      if (subscription.expiresAt && subscription.expiresAt < new Date()) {
        throw new ForbiddenError("Subscription expired");
      }

      const entitlements = entitlementsFromPlan(subscription.plan);
      if (!hasEntitlement(entitlements, feature)) {
        throw new ForbiddenError(`Your plan does not include ${feature.replace(/_/g, " ")}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/** @deprecated Use requireEntitlement */
export const requireProSubscription = requireEntitlement("customer_ordering");

export async function getOwnerSubscriptionState(ownerId: string) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { id: ownerId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!owner?.subscription) {
    return {
      status: "pending" as const,
      planSlug: null,
      entitlements: entitlementsFromPlan({ slug: "basic" }),
      isPro: false,
      isActive: false,
      expiresAt: null as Date | null,
    };
  }

  const sub = owner.subscription;
  const isExpired =
    sub.status === "expired" ||
    (sub.expiresAt !== null && sub.expiresAt < new Date());

  const entitlements = entitlementsFromPlan(sub.plan);

  return {
    status: isExpired ? ("expired" as const) : sub.status,
    planSlug: sub.plan.slug,
    entitlements,
    isPro: hasEntitlement(entitlements, "customer_ordering"),
    isActive: sub.status === "active" && !isExpired,
    expiresAt: sub.expiresAt,
  };
}

export function isSubscriptionActive(
  sub: { status: string; expiresAt: Date | null } | null | undefined,
): boolean {
  if (!sub || sub.status !== "active") return false;
  if (sub.expiresAt && sub.expiresAt < new Date()) return false;
  return true;
}
