import React, { useState } from "react";
import { api } from "~/utils/api";

const ImageUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const getPresignedUrlMutation = api.aws.getPresignedUrl.useMutation();

  const fetchImagesQuery = api.images.getAll.useQuery();
  const createImageMutation = api.images.create.useMutation({
    onSuccess: async () => {
      await fetchImagesQuery.refetch();
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      const randomHash = Math.random().toString(36).substring(2, 15);
      const fileNameToUpload = randomHash + selectedFile.name;

      // Use the tRPC hook to call your backend
      const result = await getPresignedUrlMutation.mutateAsync({
        fileType: selectedFile.type,
        fileName: fileNameToUpload,
      });

      const { url } = result;

      // Use the presigned URL to upload the file directly to the storage service
      await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      await createImageMutation.mutateAsync({
        fileName: fileNameToUpload,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={uploadImage}
        className="rounded border px-4 py-2 font-bold text-black hover:bg-gray-100"
      >
        Upload Image
      </button>
    </div>
  );
};

export default ImageUpload;
