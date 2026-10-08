import { createFileRoute } from "@tanstack/react-router";
import { ToolWorkspace } from "@/components/tool-workspace";
import { getToolSlug, tools } from "@/lib/tools";

export const Route = createFileRoute("/tools/")({
  component: SmartDispatcherPage,
});

function SmartDispatcherPage() {
  const tool = tools.find(item => getToolSlug(item) === "smart-dispatcher");
  if (!tool) return null;
  return <ToolWorkspace tool={tool} />;
}
