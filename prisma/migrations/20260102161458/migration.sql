/*
  Warnings:

  - Added the required column `area` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappNumber` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "area" TEXT NOT NULL,
ADD COLUMN     "nearbyLandmark" TEXT,
ADD COLUMN     "whatsappNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "minOrderPrice" DECIMAL(65,30);
