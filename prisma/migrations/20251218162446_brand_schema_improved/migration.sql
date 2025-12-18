/*
  Warnings:

  - You are about to drop the column `brandId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BrandUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `Brand` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BrandUser" DROP CONSTRAINT "BrandUser_brandId_fkey";

-- DropForeignKey
ALTER TABLE "BrandUser" DROP CONSTRAINT "BrandUser_userId_fkey";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "brandId";

-- DropTable
DROP TABLE "BrandUser";

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
