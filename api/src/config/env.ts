import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_ADMIN_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ADMIN_EMAIL: z.string().email().default("admin@cafeos.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMeAdmin123"),
  WEB_APP_URL: z.string().url().default("http://localhost:8080"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("CaféOS <noreply@cafeos.local>"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),
  UPLOAD_DIR: z.string().default("uploads"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
