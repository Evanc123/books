import { db } from "../db";

export const getUnprocessed = async () => {
  return db.image.findMany({
    where: { isProcessed: false },
  });
};

export const setEmbeddingUrl = async (
  imageId: string,
  embeddingUrl: string,
) => {
  return db.image.update({
    where: { id: imageId },
    data: {
      embeddingUrl: embeddingUrl,
      isProcessed: true,
    },
  });
};
