-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "embeddingUrl" TEXT,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false;
