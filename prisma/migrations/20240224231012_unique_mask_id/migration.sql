/*
  Warnings:

  - You are about to drop the column `bookId` on the `Mask` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[maskId]` on the table `Book` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Mask" DROP CONSTRAINT "Mask_bookId_fkey";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "maskId" TEXT;

-- AlterTable
ALTER TABLE "Mask" DROP COLUMN "bookId";

-- CreateIndex
CREATE UNIQUE INDEX "Book_maskId_key" ON "Book"("maskId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_maskId_fkey" FOREIGN KEY ("maskId") REFERENCES "Mask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
