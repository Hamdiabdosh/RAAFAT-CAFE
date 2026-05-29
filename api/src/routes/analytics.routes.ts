import { Router } from "express";
import * as analyticsService from "../modules/analytics/analytics.service.js";
import { analyticsRangeSchema } from "../modules/analytics/analytics.schemas.js";
import { requireOwner, type AuthenticatedRequest } from "../middleware/auth.js";
import { requireEntitlement } from "../middleware/subscription-gate.js";
import { sendSuccess } from "../lib/response.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireOwner, requireEntitlement("analytics"));

function parseQuery(req: { query: Record<string, unknown> }) {
  return analyticsRangeSchema.parse(req.query);
}

analyticsRouter.get("/summary", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getSummary(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/daily", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getDaily(user.sub, parseQuery(req));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/peak-hours", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getPeakHours(user.sub, parseQuery(req));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/top-items", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getTopItems(user.sub, parseQuery(req));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/categories", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getCategories(user.sub, parseQuery(req));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/order-types", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await analyticsService.getOrderTypes(user.sub, parseQuery(req));
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

analyticsRouter.get("/export", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const csv = await analyticsService.exportOrdersCsv(user.sub, parseQuery(req));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="orders-export.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});
