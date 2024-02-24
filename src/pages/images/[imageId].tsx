import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import App from "~/sam/App";

import dynamic from "next/dynamic";

import AppContextProvider from "~/sam/components/hooks/context";
import { useState } from "react";
import { useModel } from "~/sam/hooks/useModel";
import { EditMaskedImage } from "~/sam/components/viewImage";
const DynamicComponentWithNoSSR = dynamic(() => import("../../sam/App"), {
  ssr: false,
});

const AWS_BUCKET_URL = "https://new-bookstack.s3.amazonaws.com/";
const ImagePage: NextPage = () => {
  const router = useRouter();

  const imageId = router.query.imageId as string;

  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  const { data: image, refetch: refetchImages } = api.images.getById.useQuery(
    { id: imageId },
    {
      enabled: !!imageId,
    },
  );

  const selectedMask = image?.masks.find((mask) => mask.id === selectedMaskId);

  const isUrlAndEmbeddingNotZeroLength =
    (image?.url ?? "").length > 0 && (image?.embeddingUrl ?? "").length > 0;
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const persistMaskMutation = api.images.createMask.useMutation();

  const persistMask = (
    croppedMaskImageElement: File,
    simplifiedPolygonMask: any,
  ) => {
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

  return (
    <div className="flex p-2">
      {/* {isUrlAndEmbeddingNotZeroLength && (
        <AppContextProvider>
          <DynamicComponentWithNoSSR
            imageUrl={image?.url ?? ""}
            imageEmbeddingUrl={AWS_BUCKET_URL + image?.embeddingUrl ?? ""}
          />
        </AppContextProvider>
      )} */}
      <div className="w-1/2 shrink-0">
        Miranda&apos;s Bookshelf
        {isUrlAndEmbeddingNotZeroLength && (
          <EditMaskedImage
            src={image?.url}
            alt="test"
            polygons={image?.masks}
            selectedMask={selectedMask}
            onMaskClick={() => {}}
            setPosition={() => {}}
            removeMask={() => {}}
            sendClickToModel={sendClickToModel}
            setNaturalImageHeight={setHeight}
            setNaturalImageWidth={setWidth}
            onCreateMask={() => {}}
            setSelectedMaskId={setSelectedMaskId}
          />
        )}
      </div>
      <div className="ml-5">
        {selectedMask && (
          <div>
            <h2>Book</h2>
            <i>{selectedMask.id}</i>
            <p>{selectedMask.polygons}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePage;
