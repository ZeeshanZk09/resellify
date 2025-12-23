/*
  Warnings:

  - You are about to drop the column `name` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `title` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('TEXT', 'COLOR', 'NUMBER', 'SIZE', 'MEASURE', 'RANGE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "OfferTarget" AS ENUM ('ALL_PRODUCTS', 'CATEGORY', 'PRODUCT');

-- DropIndex
DROP INDEX "Product_name_idx";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "maxDiscount" DECIMAL(65,30),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stackable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "maxDiscount" DECIMAL(65,30),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stackable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "placedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "name",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "salePrice" DOUBLE PRECISION,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductOffer" ADD COLUMN     "couponId" TEXT,
ALTER COLUMN "offerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "createdAt",
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "OptionSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OptionType" NOT NULL,

    CONSTRAINT "OptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "position" INTEGER,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryOptionSet" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,

    CONSTRAINT "CategoryOptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT,
    "price" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weightGram" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantOption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keys" TEXT[],

    CONSTRAINT "SpecGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "specGroupId" TEXT NOT NULL,
    "values" TEXT[],

    CONSTRAINT "ProductSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryOptionSet_categoryId_optionSetId_key" ON "CategoryOptionSet"("categoryId", "optionSetId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "VariantOption_variantId_idx" ON "VariantOption"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOption_variantId_optionId_key" ON "VariantOption"("variantId", "optionId");

-- CreateIndex
CREATE INDEX "ProductSpec_productId_idx" ON "ProductSpec"("productId");

-- CreateIndex
CREATE INDEX "Product_title_idx" ON "Product"("title");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_optionSetId_fkey" FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOptionSet" ADD CONSTRAINT "CategoryOptionSet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOptionSet" ADD CONSTRAINT "CategoryOptionSet_optionSetId_fkey" FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOption" ADD CONSTRAINT "VariantOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOption" ADD CONSTRAINT "VariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_specGroupId_fkey" FOREIGN KEY ("specGroupId") REFERENCES "SpecGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
