import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import App from "~/sam/App";

import dynamic from "next/dynamic";

import AppContextProvider from "~/sam/components/hooks/context";
const DynamicComponentWithNoSSR = dynamic(() => import("../../sam/App"), {
  ssr: false,
});

const AWS_BUCKET_URL = "https://new-bookstack.s3.amazonaws.com/";
const ImagePage: NextPage = () => {
  const router = useRouter();

  const imageId = router.query.imageId as string;

  const { data: image } = api.images.getById.useQuery(
    { id: imageId },
    {
      enabled: !!imageId,
    },
  );

  const isUrlAndEmbeddingNotZeroLength =
    (image?.url ?? "").length > 0 && (image?.embeddingUrl ?? "").length > 0;

  return (
    <div>
      hello
      {imageId}
      {JSON.stringify(image)}
      {isUrlAndEmbeddingNotZeroLength && (
        <AppContextProvider>
          <DynamicComponentWithNoSSR
            imageUrl={image?.url ?? ""}
            imageEmbeddingUrl={AWS_BUCKET_URL + image?.embeddingUrl ?? ""}
          />
        </AppContextProvider>
      )}
    </div>
  );
};

export default ImagePage;
