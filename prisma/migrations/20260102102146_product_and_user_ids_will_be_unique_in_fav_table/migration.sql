/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Favourite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId]` on the table `Favourite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Favourite_userId_key" ON "Favourite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favourite_productId_key" ON "Favourite"("productId");
