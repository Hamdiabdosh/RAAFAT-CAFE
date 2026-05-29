import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type UserRole = "owner" | "staff" | "admin";

export type JwtPayload = {
  sub: string;
  role: UserRole;
  cafeId?: string;
  impersonating?: boolean;
};

export function signToken(
  payload: JwtPayload,
  expiresIn: SignOptions["expiresIn"] = env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, role: "admin" as const }, env.JWT_SECRET, {
    expiresIn: env.JWT_ADMIN_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
