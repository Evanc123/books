import type { NextApiRequest, NextApiResponse } from "next";
import { getUnprocessed } from "~/server/services/images.service";

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const out = await getUnprocessed();

  res.status(200).json({ message: JSON.stringify(out) });
}
