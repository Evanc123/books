import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { awsRouter } from "./routers/aws";
import { imagesRouter } from "./routers/images";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  aws: awsRouter,
  images: imagesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
