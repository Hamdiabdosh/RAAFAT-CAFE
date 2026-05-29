import { z } from "zod";

export const analyticsRangeSchema = z.object({
  range: z
    .enum(["today", "7days", "30days", "this_month", "custom"])
    .default("30days"),
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type AnalyticsRangeQuery = z.infer<typeof analyticsRangeSchema>;
