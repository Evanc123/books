// Import the necessary module from your service file

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { imageId, embeddingUrl } = req.body;

    // Validate the input
    if (!imageId || !embeddingUrl) {
      return res.status(400).json({ error: "Missing imageId or embeddingUrl" });
    }

    try {
      // Assuming setImageDetails is an async function
      await setImageDetails(imageId, embeddingUrl);
      return res.status(200).json({ message: "Success" });
    } catch (error) {
      // Handle any errors from your service
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Handle any non-POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
