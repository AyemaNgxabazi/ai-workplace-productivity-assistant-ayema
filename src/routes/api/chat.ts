import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";

const SYSTEM = `You are the AI assistant for an AI Workplace Productivity app. You help professionals draft emails, summarize meetings, plan tasks, and research topics. Be concise, friendly, and accurate. Use markdown formatting. Always be transparent about uncertainty.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Bad request", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway(DEFAULT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});