import { createFileRoute } from "@tanstack/react-router";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: () => (
    <ToolWorkspace
      kind="task"
      title="AI Task Planner"
      description="Describe a goal or project — get a prioritized, actionable plan."
      icon={ListChecks}
      inputLabel="What do you want to accomplish?"
      placeholder="E.g. Launch a new pricing page in 3 weeks: research, copy, design, dev, QA, launch."
      buttonLabel="Generate Plan"
      promptUsed="Create a workplace productivity plan with priorities, tasks and deadlines."
    />
  ),
});