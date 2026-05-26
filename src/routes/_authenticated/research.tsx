import { createFileRoute } from "@tanstack/react-router";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/research")({
  component: () => (
    <ToolWorkspace
      kind="research"
      title="AI Research Assistant"
      description="Ask about any topic — get a structured briefing with findings and next steps."
      icon={Search}
      inputLabel="Research topic or question"
      placeholder="E.g. Compare project management methodologies for a 12-person product team."
      buttonLabel="Generate Research"
      promptUsed="Generate structured research with key points and suggested sources."
    />
  ),
});