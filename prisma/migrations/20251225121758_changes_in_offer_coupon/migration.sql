/*
  Warnings:

  - A unique constraint covering the columns `[categoryId]` on the table `Coupon` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `discountType` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `offType` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "discountType" "DiscountType" NOT NULL;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "offType" "OfferTarget" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_categoryId_key" ON "Coupon"("categoryId");
