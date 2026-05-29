import { Router } from "express";
import * as authService from "../modules/auth/auth.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  selectPlanSchema,
} from "../modules/auth/auth.schemas.js";
import { requireOwner, type AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess } from "../lib/response.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const data = await authService.registerOwner(body);
    sendSuccess(res, data, "Registration successful. Check your email to verify.", 201);
  } catch (e) {
    next(e);
  }
});

authRouter.get("/verify/:token", async (req, res, next) => {
  try {
    const data = await authService.verifyEmail(req.params.token);
    sendSuccess(res, data, "Email verified");
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const data = await authService.loginOwner(body);
    sendSuccess(res, data, "Login successful");
  } catch (e) {
    next(e);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    sendSuccess(res, null, "Reset link sent if email exists");
  } catch (e) {
    next(e);
  }
});

authRouter.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(req.params.token, password);
    sendSuccess(res, null, "Password updated");
  } catch (e) {
    next(e);
  }
});

authRouter.post("/resend-verification", async (req, res, next) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    await authService.resendVerification(email);
    sendSuccess(res, null, "Verification sent if account exists");
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireOwner, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await authService.getMe(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/select-plan", requireOwner, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { plan, billing_interval } = selectPlanSchema.parse(req.body);
    const data = await authService.selectPlan(user.sub, plan, billing_interval);
    sendSuccess(res, data, "Plan selected. Awaiting activation.");
  } catch (e) {
    next(e);
  }
});
