import { z } from "zod";

export const categoryNameSchema = z.object({
  name: z.string().min(2).max(50),
});

export const categoryReorderSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    }),
  ),
});

export const publishMenuSchema = z.object({
  status: z.enum(["published", "unpublished"]),
});

const priceSchema = z
  .number({ invalid_type_error: "Price must be a number" })
  .positive("Price must be greater than 0")
  .multipleOf(0.01, "Max 2 decimal places");

const priceAdjSchema = z.number().min(0).multipleOf(0.01);

export const createItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().nullable(),
  base_price: priceSchema,
  dietary_tag_ids: z.array(z.string().uuid()).optional(),
});

export const updateItemSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional().nullable(),
  base_price: priceSchema.optional(),
  dietary_tag_ids: z.array(z.string().uuid()).optional(),
});

export const availabilitySchema = z.object({
  availability: z.enum(["available", "sold_out"]),
});

export const modifierGroupSchema = z.object({
  name: z.string().min(2).max(50),
  is_required: z.boolean().default(false),
  is_multi: z.boolean().default(false),
});

export const modifierGroupUpdateSchema = modifierGroupSchema.partial();

export const modifierOptionSchema = z.object({
  name: z.string().min(2).max(50),
  price_adj: priceAdjSchema.default(0),
});

export const modifierOptionUpdateSchema = modifierOptionSchema.partial();

export const itemReorderSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    }),
  ),
});
