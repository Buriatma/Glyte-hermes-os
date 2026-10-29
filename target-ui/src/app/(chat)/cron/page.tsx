import { CronControl } from "@/components/hermes/CronControl";

export const metadata = {
  title: "Hermes Cron Jobs - Glyte Hermes OS",
};

export default function CronPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <CronControl />
    </div>
  );
}
