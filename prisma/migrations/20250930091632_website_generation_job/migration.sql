-- CreateEnum
CREATE TYPE "public"."WebsiteGenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."WebsiteGenerationJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "agentData" TEXT,
    "status" "public"."WebsiteGenerationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "WebsiteGenerationJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WebsiteGenerationJob" ADD CONSTRAINT "WebsiteGenerationJob_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
