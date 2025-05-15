/*
  Warnings:

  - You are about to drop the `AgentWebsite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Testimonial" DROP CONSTRAINT "Testimonial_agentId_fkey";

-- DropTable
DROP TABLE "AgentWebsite";

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "bio" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "officeHours" TEXT NOT NULL DEFAULT 'Mon–Fri 9am–5pm',
    "logo" TEXT,
    "heroImage" TEXT,
    "instagramUrl" TEXT,
    "blogUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_subdomain_key" ON "Agent"("subdomain");

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
