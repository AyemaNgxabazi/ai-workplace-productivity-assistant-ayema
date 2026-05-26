import { createFileRoute } from "@tanstack/react-router";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meeting")({
  component: () => (
    <ToolWorkspace
      kind="meeting"
      title="Meeting Notes Summarizer"
      description="Paste raw notes or a transcript — get a clean summary with decisions and actions."
      icon={FileText}
      inputLabel="Meeting notes or transcript"
      placeholder="Paste your raw meeting notes here…"
      buttonLabel="Summarize"
      promptUsed="Summarize meeting notes into summary, action items, key decisions, deadlines and follow-up tasks."
    />
  ),
});