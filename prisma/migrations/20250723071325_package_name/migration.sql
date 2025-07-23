-- CreateEnum
CREATE TYPE "AgentPackage" AS ENUM ('BASIC', 'DETAILED', 'CONCIERGE');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "package_name" "AgentPackage" NOT NULL DEFAULT 'DETAILED';
