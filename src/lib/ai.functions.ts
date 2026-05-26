import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway.server";

const ToolKind = z.enum(["email", "meeting", "task", "research"]);

const SYSTEM_PROMPTS: Record<z.infer<typeof ToolKind>, string> = {
  email:
    "You are a professional workplace email assistant. Generate a professional email with subject line, greeting, body and closing. Match the requested tone exactly. Output ONLY the email starting with 'Subject: ...' on the first line, a blank line, then greeting, body, and closing. No commentary.",
  meeting:
    "Summarize meeting notes into the following markdown sections: ## Summary, ## Action Items, ## Key Decisions, ## Deadlines, ## Follow-up Tasks. Be faithful to the source — do not invent facts.",
  task:
    "Create a workplace productivity plan with priorities, tasks and deadlines. Output markdown with: ## Objective, ## Priorities, ## Tasks (numbered, each with priority and deadline), ## Suggested Schedule. Be realistic and specific.",
  research:
    "Generate structured research with key points and suggested sources. Output markdown with: ## Overview, ## Key Points, ## Considerations, ## Suggested Sources (to verify). Note that sources should be independently verified.",
};

export const runAiTool = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: ToolKind,
        input: z.string().min(1).max(8000),
        tone: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const system = SYSTEM_PROMPTS[data.kind];
    const userMsg = data.tone
      ? `Tone: ${data.tone}\n\n${data.input}`
      : data.input;
    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      system,
      prompt: userMsg,
    });
    return { text };
  });