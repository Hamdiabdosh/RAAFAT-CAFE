import { mkdir } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { ValidationError } from "./errors.js";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/jpg"]);

export type UploadedImage = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

export function logoStorageKey(cafeId: string, ext: string): string {
  return `logos/${cafeId}${ext}`;
}

export function itemPhotoStorageKey(itemId: string, ext: string): string {
  return `items/${itemId}${ext}`;
}

export function validateItemPhotoFile(file: UploadedImage) {
  validateLogoFile(file);
}

export { deleteFile, uploadFile } from "./storage.js";
