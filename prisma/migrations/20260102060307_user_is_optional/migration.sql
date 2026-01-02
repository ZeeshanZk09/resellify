/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `OptionSet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OptionSet_name_key" ON "OptionSet"("name");
