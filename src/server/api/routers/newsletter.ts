import { Prisma } from "../../../../generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  TRPCError,
} from "~/server/api/trpc";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email(),
        source: z.string().trim().min(1).default("homepage"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.newsletterSignup.create({
          data: {
            email: input.email.toLowerCase(),
            source: input.source,
          },
        });

        return {
          status: "created" as const,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return {
            status: "duplicate" as const,
          };
        }

        console.error("newsletter.subscribe failed", error);

        const message =
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
          cause: error,
        });
      }
    }),
});
