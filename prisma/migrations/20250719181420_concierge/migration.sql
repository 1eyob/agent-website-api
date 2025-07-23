-- CreateEnum
CREATE TYPE "ConciergeStatus" AS ENUM ('PENDING', 'REVIEWING', 'CONTACTED', 'IN_PROGRESS', 'REVIEW', 'REVISIONS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ConciergeRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "designStyle" TEXT,
    "primaryColor" TEXT,
    "mustHaveFeatures" TEXT[],
    "bio" TEXT,
    "specialRequests" TEXT,
    "status" "ConciergeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "assignedTo" TEXT,
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastContacted" TIMESTAMP(3),
    "agentId" TEXT NOT NULL,

    CONSTRAINT "ConciergeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
