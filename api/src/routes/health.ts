import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../lib/response.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});
