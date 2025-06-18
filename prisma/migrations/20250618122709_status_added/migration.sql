-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('UNREAD', 'READ');

-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'UNREAD';
