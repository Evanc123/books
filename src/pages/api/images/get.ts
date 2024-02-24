import { type Image } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getUnprocessed } from "~/server/services/images.service";

type ResponseData = {
  images: Image[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const out = await getUnprocessed();
  res.status(200).json({ images: out });
}
