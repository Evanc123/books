-- AlterTable
ALTER TABLE "Mask" ADD COLUMN     "bookId" TEXT;

-- AddForeignKey
ALTER TABLE "Mask" ADD CONSTRAINT "Mask_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
