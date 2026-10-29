import { MemoryProfileView } from "@/components/hermes/MemoryProfileView";

export const metadata = {
  title: "Hermes Memory & Profile - Glyte Hermes OS",
};

export default function MemoryPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <MemoryProfileView />
    </div>
  );
}
