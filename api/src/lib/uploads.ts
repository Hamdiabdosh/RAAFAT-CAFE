import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { ValidationError } from "./errors.js";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/jpg"]);

export type UploadedImage = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export function getUploadRoot(): string {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

export async function ensureUploadDirs() {
  await mkdir(path.join(getUploadRoot(), "logos"), { recursive: true });
  await mkdir(path.join(getUploadRoot(), "items"), { recursive: true });
}

export function validateLogoFile(file: UploadedImage) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new ValidationError("Logo must be JPG or PNG");
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new ValidationError("Logo must be 2MB or smaller");
  }
}

export function logoPublicUrl(filename: string): string {
  return `${env.API_PUBLIC_URL}/uploads/logos/${filename}`;
}

export function logoFilename(cafeId: string, ext: string): string {
  return `${cafeId}${ext}`;
}

export function itemPhotoPublicUrl(filename: string): string {
  return `${env.API_PUBLIC_URL}/uploads/items/${filename}`;
}

export function itemPhotoFilename(itemId: string, ext: string): string {
  return `${itemId}${ext}`;
}

export function validateItemPhotoFile(file: UploadedImage) {
  validateLogoFile(file);
}
