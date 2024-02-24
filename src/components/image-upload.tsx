import React, { useState } from "react";
import { api } from "~/utils/api";

const AWS_IMAGE_PREFIX = "https://new-bookstack.s3.amazonaws.com/uploads/";

const ImageUpload: React.FC = () => {
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const getPresignedUrlMutation = api.aws.getPresignedUrl.useMutation();

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
      const image = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });
      console.log(image);

      setFileName(fileNameToUpload);

      alert("Image uploaded successfully!");
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
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Upload Image
      </button>
      {fileName && (
        <img
          src={AWS_IMAGE_PREFIX + fileName}
          alt="Uploaded image"
          className="mt-4"
        />
      )}
    </div>
  );
};

export default ImageUpload;
