import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/\d/, "Password must contain at least one number");

export const registerSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema,
  cafe_name: z.string().min(2).max(60),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const selectPlanSchema = z.object({
  plan: z.string().trim().min(1).max(20),
  billing_interval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
