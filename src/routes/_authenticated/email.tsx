import { createFileRoute } from "@tanstack/react-router";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/email")({
  component: () => (
    <ToolWorkspace
      kind="email"
      title="Smart Email Generator"
      description="Describe the email you need — recipient, context, and goal."
      icon={Mail}
      inputLabel="What should the email cover?"
      placeholder="E.g. Reply to a client asking for a 2-week project extension. Be honest about resource constraints and propose a revised timeline."
      showTone
    />
  ),
});