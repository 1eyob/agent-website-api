-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "theme" "Theme" DEFAULT 'LIGHT';
