import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { getUploadRoot } from "./uploads.js";

function isR2Configured() {
  return !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}

function getS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function storageKeyFromUrl(filenameOrUrl: string): string {
  if (filenameOrUrl.includes("/uploads/")) {
    return filenameOrUrl.split("/uploads/")[1]!;
  }
  try {
    const url = new URL(filenameOrUrl);
    return url.pathname.replace(/^\//, "");
  } catch {
    return filenameOrUrl;
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  if (isR2Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${env.R2_PUBLIC_URL}/${filename}`;
  }
  const dest = path.join(getUploadRoot(), filename);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  return `${env.API_PUBLIC_URL}/uploads/${filename}`;
}

export async function deleteFile(filenameOrUrl: string): Promise<void> {
  const key = storageKeyFromUrl(filenameOrUrl);
  if (isR2Configured()) {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
      }),
    );
    return;
  }
  const filePath = path.join(getUploadRoot(), key);
  await fs.unlink(filePath).catch(() => {});
}
