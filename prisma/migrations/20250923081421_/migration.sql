/*
  Warnings:

  - A unique constraint covering the columns `[luxvtId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listingId,agentId]` on the table `LuxvtListing` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."LuxvtListing_listingId_key";

-- AlterTable
ALTER TABLE "public"."Agent" ADD COLUMN     "agentGrade" TEXT,
ADD COLUMN     "brokerage" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isElite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "luxvtId" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zip" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_luxvtId_key" ON "public"."Agent"("luxvtId");

-- CreateIndex
CREATE UNIQUE INDEX "LuxvtListing_listingId_agentId_key" ON "public"."LuxvtListing"("listingId", "agentId");
