import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import ImageUpload from "~/components/image-upload";
import App from "~/sam/App";

import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const AWS_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

export default function Home() {
  const hello = api.post.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>books</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <main className=" flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <div>Shelves</div>
          <div className="flex flex-col items-center gap-2"> */}
      <AuthShowcase />
      {/* </div>
        </div>
      </main> */}
      <a href="https://dewey.ink">
        <div className="sticky bottom-0 right-0 w-[340px] border bg-amber-500">
          Interested in the future of books? check out dewey
        </div>
      </a>
    </>
  );
}

function AuthShowcase() {
  const router = useRouter();
  const { data: sessionData } = useSession();

  const { data: images } = !sessionData
    ? api.images.getAllPublic.useQuery()
    : api.images.getAll.useQuery();

  const routeToImageView = (imageId: string) => {
    void router.push(`/images/${imageId}`);
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      <header
        className="absolute right-4 top-0 cursor-pointer rounded-full bg-white/10 font-semibold text-black no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </header>
      <div className="absolute top-1">{sessionData && <ImageUpload />}</div>
      <div className="pt-10">
        Shelves
        {images?.map((image) => (
          <img
            onClick={() => routeToImageView(image.id)}
            key={image.id}
            src={AWS_BUCKET_NAME + image.name}
            alt={image.name}
            className="max-w-xs cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
}
