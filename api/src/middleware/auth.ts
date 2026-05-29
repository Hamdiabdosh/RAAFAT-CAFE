import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import { verifyToken, type JwtPayload, type UserRole } from "../lib/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function requireAuth(roles?: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearer(req);
      if (!token) {
        throw new UnauthorizedError();
      }

      const payload = verifyToken(token);

      if (roles && !roles.includes(payload.role)) {
        throw new ForbiddenError();
      }

      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        next(error);
        return;
      }
      next(new UnauthorizedError("Invalid or expired token"));
    }
  };
}

export function requireOwner(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  return requireAuth(["owner"])(req, _res, next);
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  return requireAuth(["admin"])(req, _res, next);
}
