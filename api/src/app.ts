import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { corsOrigins, env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { getUploadRoot } from "./lib/uploads.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { cafeRouter } from "./routes/cafe.routes.js";
import { menuRouter } from "./routes/menu.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (e.g. curl) — allow
        if (!origin) {
          callback(null, true);
          return;
        }
        // In development, allow any localhost port (Vite may use 5173, 8080, etc.)
        if (env.NODE_ENV === "development" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          callback(null, true);
          return;
        }
        if (corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Tier 1 — auth endpoints (strict): 10 requests per 15 minutes per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again in 15 minutes." },
  });

  // Tier 2 — public ordering endpoints: 60 requests per minute per IP
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
  });

  // Tier 3 — authenticated API: 300 requests per minute per IP
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/uploads", express.static(path.join(getUploadRoot())));

  app.get("/", (_req, res) => {
    res.json({ name: "CaféOS API", version: "0.1.0" });
  });

  app.use("/api", healthRouter);
  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/public", publicLimiter, publicRouter);
  app.use("/api/cafe", apiLimiter, cafeRouter);
  app.use("/api/menu", apiLimiter, menuRouter);
  app.use("/api/orders", apiLimiter, ordersRouter);
  app.use("/api/analytics", apiLimiter, analyticsRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);

  return app;
}

export { env };
