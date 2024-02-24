import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const imagesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ fileName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.image.create({
        data: {
          name: input.fileName,
          url: input.fileName,
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
