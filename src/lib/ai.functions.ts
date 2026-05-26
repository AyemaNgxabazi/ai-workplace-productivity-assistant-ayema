import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway.server";

const ToolKind = z.enum(["email", "meeting", "task", "research"]);

const SYSTEM_PROMPTS: Record<z.infer<typeof ToolKind>, string> = {
  email:
    "You are a professional workplace email writer. Produce a polished, ready-to-send email. Match the requested tone exactly. Keep it concise, clear, and professional. Output ONLY the email (Subject line on first line as 'Subject: ...', then a blank line, then the body). No commentary.",
  meeting:
    "You are an expert meeting notes summarizer. From the raw notes/transcript provided, produce a clean summary with these sections in markdown: ## Summary (2-3 sentences), ## Key Decisions, ## Action Items (with owners if mentioned), ## Open Questions. Be faithful to the source — do not invent facts.",
  task:
    "You are an AI task planner. Break the user's goal into a prioritized, actionable plan in markdown. Include: ## Objective (1 line), ## Milestones, ## Step-by-step Tasks (numbered, with estimated time), ## Dependencies & Risks, ## Suggested Schedule. Be realistic and specific.",
  research:
    "You are an AI research assistant. Provide a structured briefing in markdown with: ## Overview, ## Key Findings (bullet points), ## Considerations / Trade-offs, ## Recommended Next Steps, ## Suggested Sources to Verify. Be clear that you may not have the latest data and that sources should be verified.",
};

export const runAiTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

const SavedKind = z.enum(["email", "meeting", "task", "research"]);

export const saveOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: SavedKind,
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("saved_outputs").insert({
      user_id: userId,
      kind: data.kind,
      title: data.title,
      content: data.content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSavedOutputs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("saved_outputs")
      .select("id,kind,title,content,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });