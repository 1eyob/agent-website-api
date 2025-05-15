/*
  Warnings:

  - Added the required column `status` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'SOLD');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "PropertyStatus" NOT NULL;
