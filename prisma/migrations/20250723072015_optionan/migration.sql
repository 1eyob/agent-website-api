-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "package_name" DROP NOT NULL,
ALTER COLUMN "package_name" DROP DEFAULT;
