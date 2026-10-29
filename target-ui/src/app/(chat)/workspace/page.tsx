import { Metadata } from "next";
import { WorkspaceDrawer } from "@/components/hermes/WorkspaceDrawer";

export const metadata: Metadata = {
  title: "Workspace Explorer | GlyteOS Hermes",
  description: "Live directory tree, git diff viewer, and instant download generator for GlyteOS Hermes",
};

export default function WorkspacePage() {
  return <WorkspaceDrawer />;
}
