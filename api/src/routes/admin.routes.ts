import { Router } from "express";
import type { OwnerStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import * as authService from "../modules/auth/auth.service.js";
import * as adminService from "../modules/admin/admin.service.js";
import {
  accountStatusSchema,
  adminLoginSchema,
  createPlanSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
} from "../modules/admin/admin.schemas.js";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess } from "../lib/response.js";
import { ForbiddenError } from "../lib/errors.js";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export const adminRouter = Router();

adminRouter.post("/auth/login", async (req, res, next) => {
  try {
    const body = adminLoginSchema.parse(req.body);
    const data = await authService.adminLogin(body.email, body.password);
    sendSuccess(res, data, "Admin login successful");
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/impersonate", requireAuth(["owner"]), async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!user.impersonating) {
      throw new ForbiddenError("Not an impersonation session");
    }
    await adminService.endImpersonation(user.sub);
    sendSuccess(res, null, "Impersonation ended");
  } catch (e) {
    next(e);
  }
});

adminRouter.use(requireAdmin);

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const data = await adminService.getPlatformStats();
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/cafes", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search ?? "").trim();
    const status = req.query.status as string | undefined;

    const where: Prisma.CafeWhereInput = {
      ...(search.length >= 2
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { owner: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(status === "active" || status === "suspended"
        ? { owner: { status: status as OwnerStatus } }
        : {}),
    };

    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              fullName: true,
              status: true,
              emailVerified: true,
              subscription: { include: { plan: true } },
            },
          },
        },
      }),
      prisma.cafe.count({ where }),
    ]);

    sendSuccess(res, {
      cafes: cafes.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        owner: {
          email: c.owner.email,
          full_name: c.owner.fullName,
          status: c.owner.status,
        },
        subscription: c.owner.subscription
          ? {
              status: c.owner.subscription.status,
              plan: c.owner.subscription.plan.name,
              expires_at: c.owner.subscription.expiresAt,
            }
          : null,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/cafes/:id", async (req, res, next) => {
  try {
    const data = await adminService.getCafeDetail(paramId(req.params.id));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/cafes/:id/subscription", async (req, res, next) => {
  try {
    const admin = (req as AuthenticatedRequest).user!;
    const body = updateSubscriptionSchema.parse(req.body);
    const subscription = await adminService.updateCafeSubscription(
      paramId(req.params.id),
      admin.sub,
      body,
    );
    sendSuccess(res, { subscription }, "Subscription updated");
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/cafes/:id/account", async (req, res, next) => {
  try {
    const { status } = accountStatusSchema.parse(req.body);
    const data = await adminService.updateOwnerAccountStatus(paramId(req.params.id), status);
    sendSuccess(res, data, "Account status updated");
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/impersonate/:cafeId", async (req, res, next) => {
  try {
    const admin = (req as AuthenticatedRequest).user!;
    const data = await adminService.startImpersonation(admin.sub, paramId(req.params.cafeId));
    sendSuccess(res, data, "Impersonation started");
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/plans", async (req, res, next) => {
  try {
    const activeOnly = req.query.active === "1" || req.query.active === "true";
    const plans = await adminService.listPlans({ activeOnly });
    sendSuccess(res, { plans });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/plans", async (req, res, next) => {
  try {
    const body = createPlanSchema.parse(req.body);
    const plan = await adminService.createPlan(body);
    sendSuccess(res, { plan }, "Plan created", 201);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/plans/:id", async (req, res, next) => {
  try {
    const body = updatePlanSchema.parse(req.body);
    const plan = await adminService.updatePlan(paramId(req.params.id), body);
    sendSuccess(res, { plan }, "Plan updated");
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/plans/:id", async (req, res, next) => {
  try {
    const data = await adminService.deletePlan(paramId(req.params.id));
    sendSuccess(res, data, "Plan deleted");
  } catch (e) {
    next(e);
  }
});
