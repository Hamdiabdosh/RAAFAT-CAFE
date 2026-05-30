import type { Cafe, OperatingHour } from "@prisma/client";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import { formatTimeString, parseTimeString } from "../../lib/time.js";
import {
  deleteFile,
  logoStorageKey,
  uploadFile,
  validateLogoFile,
  type UploadedImage,
} from "../../lib/uploads.js";
import type { UpdateHoursInput, UpdateProfileInput } from "./cafe.schemas.js";

export function menuPublicUrl(slug: string): string {
  return `${env.WEB_APP_URL}/menu/${slug}`;
}

export async function getCafeByOwnerId(ownerId: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { ownerId },
    include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!cafe) throw new NotFoundError("Café not found");
  return cafe;
}

function computeProfileComplete(cafe: {
  name: string;
  address: string | null;
  description: string | null;
  phone: string | null;
}): boolean {
  return Boolean(cafe.name?.trim() && cafe.address?.trim());
}

export function formatCafeResponse(cafe: Cafe & { operatingHours?: OperatingHour[] }) {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    address: cafe.address,
    phone: cafe.phone,
    logo_url: cafe.logoUrl,
    primary_color: cafe.primaryColor,
    bg_color: cafe.bgColor,
    status: cafe.status,
    profile_complete: cafe.profileComplete,
    timezone: cafe.timezone,
    menu_url: menuPublicUrl(cafe.slug),
    hours: cafe.operatingHours?.map((h) => ({
      day_of_week: h.dayOfWeek,
      is_closed: h.isClosed,
      open_time: formatTimeString(h.openTime),
      close_time: formatTimeString(h.closeTime),
    })),
  };
}

export async function updateProfile(ownerId: string, input: UpdateProfileInput) {
  const cafe = await getCafeByOwnerId(ownerId);
  const updated = await prisma.cafe.update({
    where: { id: cafe.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    },
    include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
  });

  const profileComplete = computeProfileComplete(updated);
  if (profileComplete !== updated.profileComplete) {
    return prisma.cafe.update({
      where: { id: cafe.id },
      data: { profileComplete },
      include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
    });
  }
  return updated;
}

export async function uploadLogo(ownerId: string, file: UploadedImage) {
  validateLogoFile(file);
  const cafe = await getCafeByOwnerId(ownerId);
  const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
  const storageKey = logoStorageKey(cafe.id, ext);

  if (cafe.logoUrl) {
    await deleteFile(cafe.logoUrl);
  }

  const logoUrl = await uploadFile(file.buffer, storageKey, file.mimetype);

  return prisma.cafe.update({
    where: { id: cafe.id },
    data: { logoUrl },
    include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
}

export async function updateHours(ownerId: string, input: UpdateHoursInput) {
  const cafe = await getCafeByOwnerId(ownerId);

  for (const row of input.hours) {
    if (!row.is_closed && row.open_time && row.close_time) {
      const open = parseTimeString(row.open_time);
      const close = parseTimeString(row.close_time);
      if (open >= close) {
        throw new ValidationError(
          `Day ${row.day_of_week}: open time must be before close time`,
        );
      }
    }
  }

  await prisma.$transaction(
    input.hours.map((row) =>
      prisma.operatingHour.upsert({
        where: {
          cafeId_dayOfWeek: { cafeId: cafe.id, dayOfWeek: row.day_of_week },
        },
        create: {
          cafeId: cafe.id,
          dayOfWeek: row.day_of_week,
          isClosed: row.is_closed,
          openTime: row.is_closed || !row.open_time ? null : parseTimeString(row.open_time),
          closeTime: row.is_closed || !row.close_time ? null : parseTimeString(row.close_time),
        },
        update: {
          isClosed: row.is_closed,
          openTime: row.is_closed || !row.open_time ? null : parseTimeString(row.open_time),
          closeTime: row.is_closed || !row.close_time ? null : parseTimeString(row.close_time),
        },
      }),
    ),
  );

  return getCafeByOwnerId(ownerId);
}

export async function updateStatus(ownerId: string, status: "open" | "closed") {
  const cafe = await getCafeByOwnerId(ownerId);
  return prisma.cafe.update({
    where: { id: cafe.id },
    data: { status },
    include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
}

export async function updateTheme(
  ownerId: string,
  primaryColor: string,
  bgColor: string,
) {
  const cafe = await getCafeByOwnerId(ownerId);
  return prisma.cafe.update({
    where: { id: cafe.id },
    data: { primaryColor, bgColor },
    include: { operatingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
}

export async function getQrInfo(ownerId: string) {
  const cafe = await getCafeByOwnerId(ownerId);
  const menu_url = menuPublicUrl(cafe.slug);
  return {
    slug: cafe.slug,
    menu_url,
    qr_url: menu_url,
  };
}

export async function generateQrPng(menuUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(menuUrl, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export async function generateQrPdf(menuUrl: string, cafeName: string): Promise<Buffer> {
  const png = await generateQrPng(menuUrl);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(cafeName, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text("Scan to view our menu", { align: "center" });
    doc.moveDown();
    doc.image(png, doc.page.width / 2 - 128, doc.y, { width: 256 });
    doc.moveDown(2);
    doc.fontSize(10).fillColor("#666").text(menuUrl, { align: "center" });
    doc.end();
  });
}
