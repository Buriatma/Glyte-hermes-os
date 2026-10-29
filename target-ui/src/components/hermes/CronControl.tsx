"use client";

import { useEffect, useState } from "react";
import {
  getGatewayClient,
  HermesCronJob,
} from "@/lib/hermes/gateway-client";
import {
  Clock,
  Play,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CronControlProps {
  className?: string;
}

export function CronControl({ className }: CronControlProps) {
  const [jobs, setJobs] = useState<HermesCronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    name: "",
    schedule: "0 9 * * *",
    prompt: "",
    deliver: "local",
  });
  const [creating, setCreating] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const client = getGatewayClient();
      const list = await client.listCronJobs();
      setJobs(list);
    } catch (e) {
      console.error("Failed to load cron jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleRunNow = async (jobId: string) => {
    setRunningJobId(jobId);
    try {
      const client = getGatewayClient();
      await client.runCronJob(jobId);
      await loadJobs();
    } catch (e) {
      console.error(`Failed to trigger cron job ${jobId}:`, e);
    } finally {
      setRunningJobId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled cron job?")) return;
    try {
      const client = getGatewayClient();
      await client.deleteCronJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (e) {
      console.error(`Failed to delete cron job ${jobId}:`, e);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.schedule || !newJob.prompt) return;
    setCreating(true);
    try {
      const client = getGatewayClient();
      await client.createCronJob({
        name: newJob.name || undefined,
        schedule: newJob.schedule,
        prompt: newJob.prompt,
        deliver: newJob.deliver,
      });
      setCreateDialogOpen(false);
      setNewJob({ name: "", schedule: "0 9 * * *", prompt: "", deliver: "local" });
      await loadJobs();
    } catch (e) {
      console.error("Failed to create cron job:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
              Cron & Task Scheduler
              <Badge variant="outline" className="text-[10px] font-mono">
                {jobs.length} scheduled
              </Badge>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Automated agent instructions dispatched on recurring cron schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={loadJobs}
            disabled={loading}
            title="Refresh jobs"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            <Plus className="size-3.5" />
            New Cron Job
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span>Loading scheduled jobs from Hermes...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs p-4 border border-dashed rounded-xl">
            <Clock className="size-6 mb-2 opacity-50" />
            <p className="font-medium text-foreground">No recurring jobs configured</p>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Schedule autonomous recurring tasks, monitoring routines, and daily reports.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-3 h-7 text-xs"
            >
              <Plus className="size-3 mr-1" /> Add Your First Job
            </Button>
          </div>
        ) : (
          jobs.map((job) => {
            const isRunning = runningJobId === job.id;
            return (
              <Card
                key={job.id}
                className="border border-border/60 hover:border-primary/40 rounded-xl transition-all overflow-hidden"
              >
                <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs text-foreground">
                        {job.name || "Untitled Cron"}
                      </span>
                      <span className="ml-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-zinc-300">
                        {job.schedule}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {job.deliver || "local"}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] uppercase font-mono",
                        job.status === "paused"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      )}
                    >
                      {job.status || "active"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-1 space-y-2.5">
                  {job.prompt && (
                    <div className="rounded-lg border border-border/40 bg-black/40 p-2.5 text-xs text-zinc-300 leading-relaxed font-mono">
                      {job.prompt}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px]">ID: {job.id}</span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20"
                        onClick={() => handleDelete(job.id)}
                        title="Delete cron job"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground"
                        disabled={isRunning}
                        onClick={() => handleRunNow(job.id)}
                      >
                        {isRunning ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Play className="size-3 text-emerald-500" />
                        )}
                        <span>{isRunning ? "Running..." : "Run Now"}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Schedule Editor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Schedule New Hermes Cron Job
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure a standard 5-part cron expression and agent instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs mb-1 block">Job Name</Label>
              <Input
                placeholder="e.g. Daily Standup Summary"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                className="h-8 text-xs font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs block">Cron Expression</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  min hr dom mon dow
                </span>
              </div>
              <Input
                placeholder="*/15 * * * *"
                value={newJob.schedule}
                onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Examples: `0 9 * * *` (9 AM daily), `*/30 * * * *` (every 30 mins)
              </p>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Agent Prompt / Task</Label>
              <textarea
                placeholder="Instructions for Hermes when this cron triggers..."
                value={newJob.prompt}
                onChange={(e) => setNewJob({ ...newJob, prompt: e.target.value })}
                className="w-full h-24 p-2.5 rounded-lg border border-border/50 bg-black/60 font-mono text-xs text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Delivery Target</Label>
              <Input
                placeholder="local (or telegram, slack)"
                value={newJob.deliver}
                onChange={(e) => setNewJob({ ...newJob, deliver: e.target.value })}
                className="h-8 text-xs font-sans"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateJob}
              disabled={creating || !newJob.prompt || !newJob.schedule}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {creating ? "Scheduling..." : "Schedule Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
