import { Router } from "express";
import * as ordersService from "../modules/orders/orders.service.js";
import {
  cancelOrderSchema,
  historyQuerySchema,
  updateStatusSchema,
} from "../modules/orders/orders.schemas.js";
import { requireOwner, type AuthenticatedRequest } from "../middleware/auth.js";
import { requireEntitlement } from "../middleware/subscription-gate.js";
import { sendSuccess } from "../lib/response.js";

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export const ordersRouter = Router();

ordersRouter.use(requireOwner, requireEntitlement("order_management"));

ordersRouter.get("/live", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await ordersService.listLiveOrders(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

ordersRouter.get("/summary/today", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await ordersService.getTodaySummary(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

ordersRouter.get("/history", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const query = historyQuerySchema.parse(req.query);
    const data = await ordersService.getOrderHistory(user.sub, query);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

ordersRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = updateStatusSchema.parse(req.body);
    const data = await ordersService.updateOrderStatus(user.sub, paramId(req.params.id), body);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

ordersRouter.patch("/:id/cancel", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = cancelOrderSchema.parse(req.body);
    const data = await ordersService.cancelOrder(user.sub, paramId(req.params.id), body);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});
