import { randomBytes } from "node:crypto";

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenExpiresInHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
