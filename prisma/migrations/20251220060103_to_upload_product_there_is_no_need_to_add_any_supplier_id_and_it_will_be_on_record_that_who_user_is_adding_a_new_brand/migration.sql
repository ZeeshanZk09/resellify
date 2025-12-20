/*
  Warnings:

  - You are about to drop the column `userId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "publishedById" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
