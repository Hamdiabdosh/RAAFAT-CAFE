import { z } from "zod";

export const updateStatusSchema = z.object({
  status: z.enum(["preparing", "ready", "served"]),
});

export const cancelOrderSchema = z.object({
  cancel_reason: z.string().min(3).max(200),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  start: z.string().optional(),
  end: z.string().optional(),
  order_number: z.coerce.number().int().optional(),
});
