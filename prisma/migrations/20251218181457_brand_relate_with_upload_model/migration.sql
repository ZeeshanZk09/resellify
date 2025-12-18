/*
  Warnings:

  - You are about to drop the `ProductImage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `logo` to the `Brand` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logo" TEXT NOT NULL;

-- DropTable
DROP TABLE "ProductImage";

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "brandId" TEXT,
    "path" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Upload_brandId_key" ON "Upload"("brandId");

-- CreateIndex
CREATE INDEX "Upload_productId_order_idx" ON "Upload"("productId", "order");

-- CreateIndex
CREATE INDEX "Upload_isPrimary_idx" ON "Upload"("isPrimary");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
