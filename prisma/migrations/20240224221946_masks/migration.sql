-- CreateTable
CREATE TABLE "Mask" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "polygons" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Mask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mask" ADD CONSTRAINT "Mask_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
