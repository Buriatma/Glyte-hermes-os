import { SkillsManager } from "@/components/hermes/SkillsManager";

export const metadata = {
  title: "Hermes Skills - Glyte Hermes OS",
};

export default function SkillsPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <SkillsManager />
    </div>
  );
}
