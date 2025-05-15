/*
  Warnings:

  - Added the required column `description` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `garage` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lotSize` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearBuilt` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "garage" INTEGER NOT NULL,
ADD COLUMN     "lotSize" INTEGER NOT NULL,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "yearBuilt" INTEGER NOT NULL;
