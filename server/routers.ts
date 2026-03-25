import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getGrokResponse } from "./grok-service";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  mentor: router({
    // Get all conversations for the current user
    listConversations: protectedProcedure.query(({ ctx }) =>
      db.getUserConversations(ctx.user.id)
    ),

    // Get a specific conversation with all messages
    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => db.getConversationWithMessages(input.conversationId)),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(
        z.object({
          title: z.string().default("New Conversation"),
          context: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createMentorConversation({
          userId: ctx.user.id,
          title: input.title,
          context: input.context,
        })
      ),

    // Add a message to a conversation
    addMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })
      )
      .mutation(({ input }) =>
        db.addMentorMessage({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
        })
      ),

    // Get messages for a conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => db.getConversationMessages(input.conversationId)),

    // Update conversation title
    updateTitle: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          title: z.string(),
        })
      )
      .mutation(({ input }) =>
        db.updateConversationTitle(input.conversationId, input.title)
      ),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(({ input }) =>
        db.deleteMentorConversation(input.conversationId)
      ),

    // Get Grok AI response for a question
    askMentor: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          question: z.string().min(1).max(1000),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Get conversation history
          const messages = await db.getConversationMessages(input.conversationId);

          // Build message array for Grok
          const grokMessages = messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          // Add current question
          grokMessages.push({
            role: "user" as const,
            content: input.question,
          });

          // Get response from Grok
          const response = await getGrokResponse(
            grokMessages,
            input.context
          );

          // Save assistant response to database
          await db.addMentorMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: response,
          });

          return { success: true, response };
        } catch (error) {
          console.error("Failed to get Grok response:", error);
          throw new Error(
            `Failed to get AI response: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
