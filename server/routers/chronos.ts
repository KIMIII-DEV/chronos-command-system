import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  processChronosQuery,
  approveChronosAction,
} from "../chronos";

export const chronosRouter = router({
  query: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        userId: z.number(),
        context: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await processChronosQuery({
        query: input.prompt,
        userId: input.userId,
        context: input.context,
      });
    }),

  approveAction: publicProcedure
    .input(
      z.object({
        actionId: z.string(),
        approved: z.boolean(),
        userId: z.number(),
        command: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await approveChronosAction(
        input.actionId,
        input.approved,
        input.userId,
        input.command
      );
    }),

  health: publicProcedure.query(() => {
    return {
      status: "operational",
      version: "2.1.0-OSS-LC-OM",
      orchestrator: "LangChain Authority",
      executor: "OpenManus Sandboxed",
      timestamp: new Date().toISOString(),
    };
  }),
});
