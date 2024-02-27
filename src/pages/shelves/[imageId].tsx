import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

import { useEffect, useState } from "react";
import { useModel } from "~/sam/hooks/useModel";
import { EditMaskedImage } from "~/sam/components/viewImage";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  const updateNameMutation = api.images.updateName.useMutation({
    onSuccess: () => {
      void refetchImages();
    },
  });

  const deleteMaskMutation = api.images.deleteMask.useMutation({
    onSuccess: () => {
      void refetchImages();
    },
  });

  const [shelfName, setShelfName] = useState("");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [blurb, setBlurb] = useState("");

  useEffect(() => {
    // set title, author, and blurb to the selected mask's book's values
    if (selectedMask) {
      setTitle(selectedMask.book?.title ?? "");
      setAuthor(selectedMask.book?.author ?? "");
      setBlurb(selectedMask.book?.content ?? "");
    }
  }, [selectedMask]);

  return (
    <div className="relative">
      <Link href={"/"}>
        <header className="absolute left-4 top-4 hover:cursor-pointer hover:underline">
          bookshelf.vision
        </header>
      </Link>

      <header
        className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/10 font-semibold text-black no-underline transition hover:bg-white/20 hover:underline"
        // onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        <a
          target="_blank"
          href="https://docs.google.com/forms/d/e/1FAIpQLScvm3yB5v50DBtivI9Ju-FdDl8VUfXm2Tgy3cON0nWFJHxhpg/viewform?usp=send_form"
        >
          Join the waitlist!
        </a>
      </header>
      <div className="flex p-2 pt-8">
        <div className="w-1/2 shrink-0">
          <div className="flex justify-center">
            {image?.name}&apos;s Bookshelf
          </div>
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
          {isOwner && (
            <div className="flex justify-between">
              <div className="flex">
                <input
                  placeholder="shelf name"
                  className="border p-1"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                ></input>
                <button
                  onClick={() => {
                    void updateNameMutation.mutate({
                      id: imageId,
                      name: shelfName,
                    });
                  }}
                  className="m-1 rounded border "
                >
                  Rename
                </button>
              </div>
              <button
                onClick={() => {
                  deleteImageMutation.mutate({ id: imageId });
                }}
                className="m-1 rounded border bg-red-100 p-1 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="my-auto ml-5">
          {selectedMask && (
            <div>
              {isOwner ? (
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
                    placeholder="your review"
                    value={blurb}
                    onChange={(e) => setBlurb(e.target.value)}
                  />
                  <div className="flex justify-between">
                    Read?
                    <input
                      type="checkbox"
                      id="readCheckbox"
                      name="readCheckbox"
                      value="read"
                    />
                  </div>

                  <button
                    className="rounded border p-1 hover:bg-gray-100"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                  <button
                    className="rounded border p-1 hover:bg-red-100"
                    onClick={() => {
                      deleteMaskMutation.mutate({ id: selectedMask.id });
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div>
                  <h2>{selectedMask.book?.title}</h2>
                  <i>{selectedMask.book?.author}</i>
                  <p>{selectedMask.book?.content}</p>
                  <div className="ml-4 text-gray-500">
                    Comments: (coming soon...)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
