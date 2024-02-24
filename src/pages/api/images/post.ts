import type { NextApiRequest, NextApiResponse } from "next";
import { setEmbeddingUrl } from "~/server/services/images.service";

type RequestData = {
  imageId: string;
  embeddingUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Extract imageId and embeddingUrl from the request body in a type-safe manner
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requestData: RequestData = req.body;
    const { imageId, embeddingUrl } = requestData;

    await setEmbeddingUrl(imageId, embeddingUrl);

    // Send a response to indicate success
    res.status(200).json({ message: "Embedding URL updated successfully." });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Failed to update embedding URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
