import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const AWS_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

export const imagesRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.image.findFirst({
        where: {
          id: input.id,
        },
        include: {
          masks: {
            include: {
              book: {
                include: {
                  comments: true,
                },
              },
            },
          },
        },
      });
    }),
  create: protectedProcedure
    .input(z.object({ fileName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.image.create({
        data: {
          name: input.fileName,
          url: AWS_BUCKET_NAME + input.fileName,
          createdById: ctx.session.user.id,
        },
      });
    }),

  getAllPublic: publicProcedure.query(({ ctx }) => {
    return ctx.db.image.findMany();
  }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.image.findMany({
      where: { createdBy: { id: ctx.session.user.id } },
    });
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // check if the user is the owner
      const image = await ctx.db.image.findFirst({
        where: {
          id: input.id,
          createdBy: { id: ctx.session.user.id },
        },
      });
      if (!image) {
        throw new Error("Image not found");
      }
      return ctx.db.image.delete({
        where: {
          id: image.id,
        },
      });
    }),

  createMask: protectedProcedure
    .input(
      z.object({
        imageId: z.string().min(1),
        polygonString: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mask.create({
        data: {
          imageId: input.imageId,
          polygons: input.polygonString,
        },
      });
    }),

  createBook: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        content: z.string().min(1),
        maskId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.book.create({
        data: {
          author: input.author,
          title: input.title,
          content: input.content,
          maskId: input.maskId,
        },
      });
    }),
});
