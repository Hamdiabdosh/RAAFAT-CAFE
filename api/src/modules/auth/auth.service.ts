import type { Plan, Subscription, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../lib/errors.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/email.js";
import { signAdminToken, signToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { generateSecureToken, tokenExpiresInHours } from "../../lib/tokens.js";
import { generateUniqueCafeSlug } from "../../lib/slug.js";
import { entitlementsFromPlan } from "../../lib/entitlements.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const VERIFY_TOKEN_HOURS = 48;
const RESET_TOKEN_HOURS = 1;

function defaultOperatingHours(cafeId: string) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    cafeId,
    dayOfWeek,
    isClosed: dayOfWeek === 6,
    openTime: dayOfWeek === 6 ? null : new Date(`1970-01-01T08:00:00Z`),
    closeTime: dayOfWeek === 6 ? null : new Date(`1970-01-01T18:00:00Z`),
  }));
}

export async function registerOwner(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existing = await prisma.cafeOwner.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("Email already exists");
  }

  const basicPlan = await prisma.plan.findUnique({ where: { slug: "basic" } });
  if (!basicPlan) {
    throw new ValidationError("Plans not seeded. Run: bun run db:seed");
  }

  const verifyToken = generateSecureToken();
  const passwordHash = await hashPassword(input.password);

  const slug = await generateUniqueCafeSlug(input.cafe_name, async (s) => {
    const found = await prisma.cafe.findUnique({ where: { slug: s } });
    return Boolean(found);
  });

  const owner = await prisma.$transaction(async (tx) => {
    const newOwner = await tx.cafeOwner.create({
      data: {
        email,
        fullName: input.full_name,
        passwordHash,
        verifyToken,
        verifyTokenExpiresAt: tokenExpiresInHours(VERIFY_TOKEN_HOURS),
        status: "unverified",
      },
    });

    const cafe = await tx.cafe.create({
      data: {
        ownerId: newOwner.id,
        name: input.cafe_name,
        slug,
      },
    });

    await tx.subscription.create({
      data: {
        cafeOwnerId: newOwner.id,
        planId: basicPlan.id,
        status: "pending",
      },
    });

    await tx.menu.create({
      data: { cafeId: cafe.id },
    });

    await tx.operatingHour.createMany({
      data: defaultOperatingHours(cafe.id),
    });

    return newOwner;
  });

  await sendVerificationEmail(email, verifyToken);

  return { owner_id: owner.id, email: owner.email };
}

export async function verifyEmail(token: string) {
  const owner = await prisma.cafeOwner.findFirst({
    where: {
      verifyToken: token,
      verifyTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!owner) {
    throw new ValidationError("Invalid or expired verification token");
  }

  if (owner.emailVerified) {
    return { verified: true, already_verified: true };
  }

  await prisma.cafeOwner.update({
    where: { id: owner.id },
    data: {
      emailVerified: true,
      status: "active",
      verifyToken: null,
      verifyTokenExpiresAt: null,
    },
  });

  return { verified: true };
}

export async function resendVerification(email: string) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!owner) {
    return { sent: false };
  }

  if (owner.emailVerified) {
    throw new ValidationError("Email is already verified");
  }

  const verifyToken = generateSecureToken();
  await prisma.cafeOwner.update({
    where: { id: owner.id },
    data: {
      verifyToken,
      verifyTokenExpiresAt: tokenExpiresInHours(VERIFY_TOKEN_HOURS),
    },
  });

  await sendVerificationEmail(owner.email, verifyToken);
  return { sent: true };
}

export async function loginOwner(input: LoginInput) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      cafe: true,
      subscription: { include: { plan: true } },
    },
  });

  if (!owner || !(await verifyPassword(input.password, owner.passwordHash))) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (owner.status === "suspended") {
    throw new ForbiddenError("Account suspended");
  }

  if (!owner.emailVerified) {
    throw new ForbiddenError("Email not verified");
  }

  const accessToken = signToken({
    sub: owner.id,
    role: "owner",
    cafeId: owner.cafe?.id,
  });

  return {
    access_token: accessToken,
    owner: formatOwnerSession(owner, owner.subscription, owner.cafe?.id),
  };
}

export async function forgotPassword(email: string) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!owner) {
    return;
  }

  if (!owner.emailVerified) {
    throw new ForbiddenError("Verify your email before resetting password");
  }

  const resetToken = generateSecureToken();
  await prisma.cafeOwner.update({
    where: { id: owner.id },
    data: {
      resetToken,
      resetTokenExpiresAt: tokenExpiresInHours(RESET_TOKEN_HOURS),
    },
  });

  await sendPasswordResetEmail(owner.email, resetToken);
}

export async function resetPassword(token: string, password: string) {
  const owner = await prisma.cafeOwner.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!owner) {
    throw new ValidationError("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(password);
  await prisma.cafeOwner.update({
    where: { id: owner.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  });
}

export async function selectPlan(
  ownerId: string,
  planSlug: string,
  billingInterval: "monthly" | "yearly" = "monthly",
) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { id: ownerId },
    include: { subscription: true },
  });

  if (!owner) {
    throw new NotFoundError("Owner not found");
  }

  if (owner.selectedPlanSlug) {
    throw new ForbiddenError(
      "Your plan preference is already set. Contact the platform admin to change your subscription.",
    );
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan || !plan.isActive) {
    throw new NotFoundError("Plan not found");
  }

  if (billingInterval === "yearly" && plan.priceYearly == null) {
    throw new ValidationError("This plan does not offer yearly billing");
  }

  const subscription = owner.subscription;
  if (!subscription) {
    throw new NotFoundError("Subscription not found");
  }

  await prisma.$transaction([
    prisma.cafeOwner.update({
      where: { id: ownerId },
      data: {
        selectedPlanSlug: planSlug,
        selectedBillingInterval: billingInterval,
      },
    }),
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id, status: "pending" },
    }),
  ]);

  return {
    plan: planSlug,
    billing_interval: billingInterval,
    status: "pending" as SubscriptionStatus,
  };
}

export async function getMe(ownerId: string) {
  const owner = await prisma.cafeOwner.findUnique({
    where: { id: ownerId },
    include: {
      cafe: true,
      subscription: { include: { plan: true } },
    },
  });

  if (!owner) {
    throw new NotFoundError("Owner not found");
  }

  return {
    owner: formatOwnerSession(owner, owner.subscription, owner.cafe?.id),
    cafe: owner.cafe,
    subscription: owner.subscription
      ? formatSubscription(owner.subscription, owner.subscription.plan)
      : null,
  };
}

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new UnauthorizedError("Invalid credentials");
  }

  return {
    access_token: signAdminToken(admin.id),
    admin: { id: admin.id, email: admin.email },
  };
}

function formatOwnerSession(
  owner: {
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
    status: string;
    selectedPlanSlug: string | null;
    selectedBillingInterval: string | null;
  },
  subscription: { status: SubscriptionStatus } | null,
  cafeId?: string,
) {
  return {
    id: owner.id,
    email: owner.email,
    full_name: owner.fullName,
    email_verified: owner.emailVerified,
    status: owner.status,
    cafe_id: cafeId ?? null,
    selected_plan: owner.selectedPlanSlug,
    selected_billing_interval: owner.selectedBillingInterval,
    subscription_status: subscription?.status ?? "pending",
  };
}

function formatSubscription(
  sub: Subscription,
  plan: Plan,
) {
  return {
    id: sub.id,
    status: sub.status,
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price_monthly: Number(plan.price),
      price_yearly: plan.priceYearly != null ? Number(plan.priceYearly) : null,
      entitlements: entitlementsFromPlan(plan),
      features: Array.isArray(plan.features)
        ? (plan.features as unknown[]).filter((f): f is string => typeof f === "string")
        : [],
    },
    starts_at: sub.startsAt,
    expires_at: sub.expiresAt,
  };
}
