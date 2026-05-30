import { Router } from "express";
import * as cafeService from "../modules/cafe/cafe.service.js";
import {
  updateHoursSchema,
  updateProfileSchema,
  updateStatusSchema,
  updateThemeSchema,
} from "../modules/cafe/cafe.schemas.js";
import { requireOwner, type AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { formatTimeString } from "../lib/time.js";
import { upload } from "../lib/uploads.js";

export const cafeRouter = Router();

cafeRouter.use(requireOwner);

cafeRouter.get("/profile", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const cafe = await cafeService.getCafeByOwnerId(user.sub);
    sendSuccess(res, cafeService.formatCafeResponse(cafe));
  } catch (e) {
    next(e);
  }
});

cafeRouter.patch("/profile", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = updateProfileSchema.parse(req.body);
    const cafe = await cafeService.updateProfile(user.sub, body);
    sendSuccess(res, cafeService.formatCafeResponse(cafe), "Profile updated");
  } catch (e) {
    next(e);
  }
});

cafeRouter.post("/profile/logo", upload.single("logo"), async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!req.file) {
      throw new ValidationError("Logo file is required");
    }
    const cafe = await cafeService.uploadLogo(user.sub, req.file);
    sendSuccess(res, cafeService.formatCafeResponse(cafe), "Logo uploaded");
  } catch (e) {
    next(e);
  }
});

cafeRouter.get("/hours", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const cafe = await cafeService.getCafeByOwnerId(user.sub);
    sendSuccess(res, {
      hours: cafe.operatingHours.map((h) => ({
        day_of_week: h.dayOfWeek,
        is_closed: h.isClosed,
        open_time: formatTimeString(h.openTime),
        close_time: formatTimeString(h.closeTime),
      })),
    });
  } catch (e) {
    next(e);
  }
});

cafeRouter.put("/hours", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = updateHoursSchema.parse(req.body);
    const cafe = await cafeService.updateHours(user.sub, body);
    sendSuccess(res, { hours: cafeService.formatCafeResponse(cafe).hours }, "Hours updated");
  } catch (e) {
    next(e);
  }
});

cafeRouter.patch("/status", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { status } = updateStatusSchema.parse(req.body);
    const cafe = await cafeService.updateStatus(user.sub, status);
    sendSuccess(res, { status: cafe.status });
  } catch (e) {
    next(e);
  }
});

cafeRouter.patch("/theme", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const body = updateThemeSchema.parse(req.body);
    const cafe = await cafeService.updateTheme(user.sub, body.primary_color, body.bg_color);
    sendSuccess(
      res,
      { primary_color: cafe.primaryColor, bg_color: cafe.bgColor },
      "Theme updated",
    );
  } catch (e) {
    next(e);
  }
});

cafeRouter.get("/qr", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const data = await cafeService.getQrInfo(user.sub);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

cafeRouter.get("/qr/download", async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const format = String(req.query.format ?? "png").toLowerCase();
    if (format !== "png" && format !== "pdf") {
      throw new ValidationError("format must be png or pdf");
    }
    const cafe = await cafeService.getCafeByOwnerId(user.sub);
    const menuUrl = cafeService.menuPublicUrl(cafe.slug);

    if (format === "png") {
      const buffer = await cafeService.generateQrPng(menuUrl);
      res.setHeader("Content-Type", "image/png");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${cafe.slug}-qr.png"`,
      );
      return res.send(buffer);
    }

    const buffer = await cafeService.generateQrPdf(menuUrl, cafe.name);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${cafe.slug}-qr.pdf"`,
    );
    return res.send(buffer);
  } catch (e) {
    next(e);
  }
});
