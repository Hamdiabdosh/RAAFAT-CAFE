import cors from "cors";
import express from "express";
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
  app.use("/uploads", express.static(path.join(getUploadRoot())));

  app.get("/", (_req, res) => {
    res.json({ name: "CaféOS API", version: "0.1.0" });
  });

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/cafe", cafeRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use(errorHandler);

  return app;
}

export { env };
