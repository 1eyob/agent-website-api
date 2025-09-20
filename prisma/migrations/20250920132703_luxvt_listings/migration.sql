-- CreateTable
CREATE TABLE "public"."LuxvtListing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "squareFeet" TEXT NOT NULL,
    "unitOfMeasurement" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LuxvtListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LuxvtListing_listingId_key" ON "public"."LuxvtListing"("listingId");

-- AddForeignKey
ALTER TABLE "public"."LuxvtListing" ADD CONSTRAINT "LuxvtListing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
