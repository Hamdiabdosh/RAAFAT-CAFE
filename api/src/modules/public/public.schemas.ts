import { z } from "zod";

const selectedModifierSchema = z.object({
  group_id: z.string().uuid(),
  option_ids: z.array(z.string().uuid()).min(1),
});

const cartItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  selected_modifiers: z.array(selectedModifierSchema).default([]),
});

export const placeOrderSchema = z
  .object({
    cafe_id: z.string().uuid(),
    type: z.enum(["dine_in", "takeaway"]),
    table_number: z.number().int().min(1).max(999).optional(),
    note: z.string().max(200).optional(),
    items: z.array(cartItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.type === "dine_in" && data.table_number == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table number is required for dine-in",
        path: ["table_number"],
      });
    }
    if (data.type === "takeaway" && data.table_number != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table number is only for dine-in",
        path: ["table_number"],
      });
    }
  });
