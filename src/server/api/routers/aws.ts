import { z } from "zod";
import * as trpc from "@trpc/server";
import AWS from "aws-sdk";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "process";

// Configure AWS
const s3 = new AWS.S3({
  region: "us-east-1",
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

export const awsRouter = createTRPCRouter({
  getPresignedUrl: protectedProcedure
    .input(z.object({ fileType: z.string(), fileName: z.string() })) // Using zod for input validation
    .mutation(async ({ input }) => {
      const { fileType, fileName } = input;
      const s3Params = {
        Bucket: "new-bookstack",
        Key: `uploads/${fileName}`, // Unique file name. Customize as needed.
        Expires: 60, // URL expiration time in seconds
        ContentType: fileType,
      };

      try {
        const presignedUrl = await s3.getSignedUrlPromise(
          "putObject",
          s3Params,
        );
        return { url: presignedUrl };
      } catch (error) {
        throw new trpc.TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate presigned URL",
        });
      }
    }),
});
