/*
  Warnings:

  - The values [FEATURED,SOLD] on the enum `PropertyType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `communityId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PropertyStatus" ADD VALUE 'PENDING';
ALTER TYPE "PropertyStatus" ADD VALUE 'NEW';
ALTER TYPE "PropertyStatus" ADD VALUE 'REDUCED';
ALTER TYPE "PropertyStatus" ADD VALUE 'OFF_MARKET';
ALTER TYPE "PropertyStatus" ADD VALUE 'EXCLUSIVE';

-- AlterEnum
BEGIN;
CREATE TYPE "PropertyType_new" AS ENUM ('SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE', 'LAND');
ALTER TABLE "Property" ALTER COLUMN "type" TYPE "PropertyType_new" USING ("type"::text::"PropertyType_new");
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "PropertyType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "communityId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
