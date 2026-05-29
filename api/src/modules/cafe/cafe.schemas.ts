import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color");

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional().nullable(),
  address: z.string().max(120).optional().nullable(),
  phone: z
    .string()
    .max(30)
    .regex(/^[+\d\s()-]*$/, "Invalid phone format")
    .optional()
    .nullable(),
  timezone: z.string().max(64).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export const updateThemeSchema = z.object({
  primary_color: hexColor,
  bg_color: hexColor,
});

const hourRowSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_closed: z.boolean(),
    open_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable(),
    close_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable(),
  })
  .superRefine((row, ctx) => {
    if (!row.is_closed) {
      if (!row.open_time || !row.close_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Open and close times required when not closed",
        });
      }
    }
  });

export const updateHoursSchema = z.object({
  hours: z.array(hourRowSchema).length(7),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateHoursInput = z.infer<typeof updateHoursSchema>;
