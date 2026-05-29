import { Router } from "express";
import * as publicService from "../modules/public/public.service.js";
import { placeOrderSchema } from "../modules/public/public.schemas.js";
import { sendSuccess } from "../lib/response.js";

function paramValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export const publicRouter = Router();

publicRouter.get("/plans", async (_req, res, next) => {
  try {
    const plans = await publicService.listActivePlans();
    sendSuccess(res, { plans });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/menu/:slug", async (req, res, next) => {
  try {
    const slug = paramValue(req.params.slug);
    const data = await publicService.getPublicMenu(slug);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

publicRouter.post("/orders", async (req, res, next) => {
  try {
    const body = placeOrderSchema.parse(req.body);
    const data = await publicService.placeOrder(body);
    sendSuccess(res, data, "Order placed", 201);
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/orders/:orderToken", async (req, res, next) => {
  try {
    const orderToken = paramValue(req.params.orderToken);
    const data = await publicService.getOrderByToken(orderToken);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});
