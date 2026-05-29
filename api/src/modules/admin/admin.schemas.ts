import { z } from "zod";
import { ENTITLEMENT_KEYS, type EntitlementKey } from "../../lib/entitlements.js";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateSubscriptionSchema = z.object({
  plan_id: z.string().uuid().optional(),
  plan_slug: z.string().min(1).max(20).optional(),
  status: z.enum(["pending", "active", "expired", "cancelled"]),
  starts_at: z.coerce.date().optional().nullable(),
  expires_at: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const accountStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(20, "Slug must be at most 20 characters")
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens");

const priceSchema = z
  .number({ invalid_type_error: "Price must be a number" })
  .min(0, "Price cannot be negative")
  .multipleOf(0.01, "Max 2 decimal places");

const featuresSchema = z.array(z.string().trim().min(1).max(120)).max(50);

const entitlementKeySchema = z.enum(
  ENTITLEMENT_KEYS as unknown as [EntitlementKey, ...EntitlementKey[]],
);

const entitlementsSchema = z
  .record(entitlementKeySchema, z.boolean())
  .optional()
  .transform((val) => val ?? {});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: slugSchema,
  price: priceSchema,
  price_yearly: priceSchema.nullable().optional(),
  entitlements: entitlementsSchema,
  features: featuresSchema.optional().default([]),
  is_active: z.boolean().optional().default(true),
});

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    slug: slugSchema.optional(),
    price: priceSchema.optional(),
    price_yearly: priceSchema.nullable().optional(),
    entitlements: z.record(entitlementKeySchema, z.boolean()).optional(),
    features: featuresSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });
