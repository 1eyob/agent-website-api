/*
  Warnings:

  - The `officeHours` column on the `Agent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "officeHours",
ADD COLUMN     "officeHours" JSONB;
