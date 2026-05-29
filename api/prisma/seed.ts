import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  BASIC_ENTITLEMENTS,
  BASIC_MARKETING_FEATURES,
  PRO_ENTITLEMENTS,
  PRO_MARKETING_FEATURES,
} from "../src/lib/entitlements.js";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cafeos.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMeAdmin123";

  const basicPlan = await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {
      name: "Basic",
      price: 19.0,
      priceYearly: 190.0,
      entitlements: BASIC_ENTITLEMENTS,
      features: BASIC_MARKETING_FEATURES,
      isActive: true,
    },
    create: {
      name: "Basic",
      slug: "basic",
      price: 19.0,
      priceYearly: 190.0,
      entitlements: BASIC_ENTITLEMENTS,
      features: BASIC_MARKETING_FEATURES,
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {
      name: "Pro",
      price: 49.0,
      priceYearly: 490.0,
      entitlements: PRO_ENTITLEMENTS,
      features: PRO_MARKETING_FEATURES,
      isActive: true,
    },
    create: {
      name: "Pro",
      slug: "pro",
      price: 49.0,
      priceYearly: 490.0,
      entitlements: PRO_ENTITLEMENTS,
      features: PRO_MARKETING_FEATURES,
      isActive: true,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
    },
  });

  const dietaryTags = [
    "vegan",
    "vegetarian",
    "gluten-free",
    "nuts",
    "dairy",
    "spicy",
  ];

  for (const name of dietaryTags) {
    await prisma.dietaryTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seed complete:");
  console.log(`  Plans: ${basicPlan.slug}, ${proPlan.slug}`);
  console.log(`  Admin: ${adminEmail}`);
  console.log(`  Dietary tags: ${dietaryTags.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
