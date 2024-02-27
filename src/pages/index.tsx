import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import ImageUpload from "~/components/image-upload";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

const AWS_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

export default function Home() {
  return (
    <>
      <Head>
        <title>bookshelves</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthShowcase />
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

  // Check for 'myShelves' query param, default to 'false' if not present
  const myShelves = router.query.myShelves ?? "false";

  const { data: images } =
    myShelves === "true"
      ? api.images.getAll.useQuery()
      : api.images.getAllPublic.useQuery();

  const routeToImageView = (imageId: string) => {
    void router.push(`/shelves/${imageId}`);
  };

  const toggleShelveView = (status: string) => {
    void router.push({
      query: { ...router.query, myShelves: status },
    });
  };

  const shouldShowSignupButton = !sessionData && myShelves === "true";

  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      <header className="absolute left-4 top-4 hover:cursor-pointer hover:underline">
        bookshelf.vision
      </header>

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
        {/* {sessionData ? "Sign out" : "Sign in"} */}
      </header>
      <div className="absolute top-1">{sessionData && <ImageUpload />}</div>
      <div className="flex gap-4 pt-4">
        <div
          className={`${myShelves === "false" ? "underline " : "hover:underline hover:decoration-slate-300"} cursor-pointer`}
          onClick={() => toggleShelveView("false")}
        >
          Featured Shelves
        </div>
        <div
          className={`${myShelves === "true" ? "underline hover:decoration-black" : "hover:underline hover:decoration-slate-300"} cursor-pointer `}
          onClick={() => toggleShelveView("true")}
        >
          My Shelves
        </div>
        <div className="cursor-disabled group text-gray-500">
          Top Books
          <span className="absolute hidden rounded bg-gray-500 px-2 py-1 text-xs text-white group-hover:block">
            Coming Soon
          </span>
        </div>
      </div>

      {shouldShowSignupButton && (
        <div className="flex flex-col items-center gap-4">
          <div>
            <a
              target="_blank"
              href="https://docs.google.com/forms/d/e/1FAIpQLScvm3yB5v50DBtivI9Ju-FdDl8VUfXm2Tgy3cON0nWFJHxhpg/viewform?usp=send_form"
            >
              <span
                // onClick={() => void signIn()}
                className="mr-1.5 cursor-pointer underline decoration-slate-500 hover:decoration-black"
              >
                Join the waitlist
              </span>
            </a>
            to upload your shelves soon!
          </div>
        </div>
      )}

      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 1, 750: 2 }}
        className="w-full px-4 pt-6 sm:px-40"
      >
        <Masonry columnsCount={2}>
          {images?.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              onClick={() => routeToImageView(image.id)}
              src={image.url}
              alt={image.name}
              className="w-full cursor-pointer object-cover"
              style={{ aspectRatio: "auto" }}
            />
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
}
