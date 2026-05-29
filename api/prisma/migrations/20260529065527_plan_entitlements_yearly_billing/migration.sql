-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('monthly', 'yearly');

-- AlterTable
ALTER TABLE "cafe_owners" ADD COLUMN     "selected_billing_interval" "BillingInterval";

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "entitlements" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "price_yearly" DECIMAL(10,2);
