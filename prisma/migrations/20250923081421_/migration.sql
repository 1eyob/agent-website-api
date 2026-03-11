/*
  Warnings:

  - A unique constraint covering the columns `[luxvtId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listingId,agentId]` on the table `LuxvtListing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex (conditional - only if exists)
DROP INDEX IF EXISTS "public"."LuxvtListing_listingId_key";

-- AlterTable (add columns if they don't exist)
ALTER TABLE "public"."Agent" ADD COLUMN IF NOT EXISTS "agentGrade" TEXT,
ADD COLUMN IF NOT EXISTS "brokerage" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "isElite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "license" TEXT,
ADD COLUMN IF NOT EXISTS "luxvtId" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "zip" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_luxvtId_key" ON "public"."Agent"("luxvtId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LuxvtListing_listingId_agentId_key" ON "public"."LuxvtListing"("listingId", "agentId");
