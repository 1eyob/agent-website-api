/*
  Warnings:

  - Added the required column `subdomain` to the `ContactRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "subdomain" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_subdomain_fkey" FOREIGN KEY ("subdomain") REFERENCES "Agent"("subdomain") ON DELETE CASCADE ON UPDATE CASCADE;
