import { SessionsPanel } from "@/components/hermes/SessionsPanel";

export const metadata = {
  title: "Hermes Sessions - Glyte Hermes OS",
};

export default function SessionsPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <SessionsPanel />
    </div>
  );
}
