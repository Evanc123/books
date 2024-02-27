import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

import { useState } from "react";
import { useModel } from "~/sam/hooks/useModel";
import { EditMaskedImage } from "~/sam/components/viewImage";
import { useSession } from "next-auth/react";

const AWS_BUCKET_URL = "https://new-bookstack.s3.amazonaws.com/";
const ImagePage: NextPage = () => {
  const router = useRouter();

  const imageId = router.query.imageId as string;

  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  const { data: user } = useSession();
  const { data: image, refetch: refetchImages } = api.images.getById.useQuery(
    { id: imageId },
    {
      enabled: !!imageId,
    },
  );
  const isOwner = user?.user.id === image?.createdById;

  const selectedMask = image?.masks.find((mask) => mask.id === selectedMaskId);

  const isUrlAndEmbeddingNotZeroLength =
    (image?.url ?? "").length > 0 && (image?.embeddingUrl ?? "").length > 0;
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const persistMaskMutation = api.images.createMask.useMutation({
    onSuccess: () => {
      void refetchImages();
    },
  });

  const persistMask = (
    croppedMaskImageElement: File,
    simplifiedPolygonMask: any,
  ) => {
    if (!isOwner) {
      return;
    }
    const polygons = JSON.stringify(simplifiedPolygonMask);
    persistMaskMutation.mutate({
      imageId,
      polygonString: polygons,
    });
    void refetchImages();

    return "";
  };

  const { isModelLoaded, sendClickToModel } = useModel({
    w: width,
    h: height,
    imageEmbeddingUrl: AWS_BUCKET_URL + image?.embeddingUrl,
    persistMask,
  });

  const deleteImageMutation = api.images.delete.useMutation({
    onSuccess: () => {
      void router.push("/");
    },
  });

  const createBookMutation = api.images.createBook.useMutation({
    onSuccess: () => {
      void refetchImages();
    },
  });

  const handleSubmit = async () => {
    if (!selectedMask) {
      return;
    }
    if (!title || !author || !blurb) {
      return;
    }
    createBookMutation.mutate({
      title,
      author,
      content: blurb,
      maskId: selectedMask.id,
    });
    setTitle("");
    setAuthor("");
    setBlurb("");
    await refetchImages();
  };

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [blurb, setBlurb] = useState("");

  return (
    <div className="flex p-2">
      <div className="w-1/2 shrink-0">
        Miranda&apos;s Bookshelf
        {isUrlAndEmbeddingNotZeroLength && (
          <EditMaskedImage
            src={image?.url ?? ""}
            alt="test"
            polygons={image?.masks}
            selectedMask={selectedMask}
            sendClickToModel={sendClickToModel}
            setNaturalImageHeight={setHeight}
            setNaturalImageWidth={setWidth}
            setSelectedMaskId={setSelectedMaskId}
          />
        )}
        <button
          onClick={() => {
            deleteImageMutation.mutate({ id: imageId });
          }}
          className="m-1 rounded border p-1"
        >
          Delete
        </button>
      </div>
      <div className="my-auto ml-5">
        {selectedMask && (
          <div>
            {!selectedMask.book && isOwner ? (
              <div className="flex flex-col gap-1">
                <input
                  className="border p-1"
                  placeholder="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  className="border p-1"
                  placeholder="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
                <textarea
                  className="border p-1"
                  placeholder="blurb"
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                />
                <button
                  className="rounded border p-1 hover:bg-gray-100"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            ) : (
              <div>
                <h2>{selectedMask.book?.title}</h2>
                <i>{selectedMask.book?.author}</i>
                <p>{selectedMask.book?.content}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePage;
