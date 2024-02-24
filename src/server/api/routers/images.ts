import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const AWS_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

export const imagesRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.image.findFirst({
        where: {
          id: input.id,
          createdBy: { id: ctx.session.user.id },
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

  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.image.findMany({
      where: { createdBy: { id: ctx.session.user.id } },
    });
  }),
});
