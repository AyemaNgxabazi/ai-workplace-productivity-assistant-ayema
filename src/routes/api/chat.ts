import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM = `You are the AI assistant for an AI Workplace Productivity app. You help professionals draft emails, summarize meetings, plan tasks, and research topics. Be concise, friendly, and accurate. Use markdown formatting. Always be transparent about uncertainty.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claims?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claims.claims.sub as string;

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        const { data: thread, error: tErr } = await supabase
          .from("chat_threads")
          .select("id,title")
          .eq("id", threadId)
          .single();
        if (tErr || !thread) return new Response("Thread not found", { status: 404 });

        const lastUser = messages[messages.length - 1];
        if (lastUser && lastUser.role === "user") {
          const { error: insErr } = await supabase.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as never,
          });
          if (insErr) console.error("user msg insert", insErr);

          if (thread.title === "New conversation") {
            const firstText =
              (lastUser.parts.find((p) => p.type === "text") as { text?: string } | undefined)?.text ?? "";
            const title = firstText.slice(0, 60) || "New conversation";
            await supabase.from("chat_threads").update({ title, updated_at: new Date().toISOString() }).eq("id", threadId);
          } else {
            await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
          }
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway(DEFAULT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant && assistant.role === "assistant") {
              const { error: aErr } = await supabaseAdmin.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as never,
              });
              if (aErr) console.error("assistant msg insert", aErr);
            }
          },
        });
      },
    },
  },
});