import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      db: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      db: "unreachable",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }
});
