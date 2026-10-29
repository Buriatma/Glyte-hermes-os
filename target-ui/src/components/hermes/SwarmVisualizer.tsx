"use client";

import { useState } from "react";
import {
  Bot,
  GitFork,
  Radio,
  CheckCircle2,
  Clock,
  Share2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface SubagentNode {
  id: string;
  name: string;
  role: "coordinator" | "researcher" | "coder" | "reviewer";
  task: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  tokens: number;
  children?: SubagentNode[];
}

export function SwarmVisualizer() {
  const [isBotMode, setIsBotMode] = useState(false);
  const [deliveryTarget, setDeliveryTarget] = useState<"webui" | "discord" | "telegram" | "local">("webui");
  const [subagents] = useState<SubagentNode[]>([
    {
      id: "agent-root",
      name: "Root Orchestrator",
      role: "coordinator",
      task: "Analyze codebase and execute multi-phase migration",
      status: "running",
      progress: 75,
      tokens: 3840,
      children: [
        {
          id: "sub-1",
          name: "Security Auditing Subagent",
          role: "reviewer",
          task: "Audit ~/.hermes/.env secrets and input sanitization",
          status: "completed",
          progress: 100,
          tokens: 1220,
        },
        {
          id: "sub-2",
          name: "Terminal & TUI Subagent",
          role: "coder",
          task: "Mount xterm.js pty WebSocket connection",
          status: "running",
          progress: 80,
          tokens: 2450,
        },
        {
          id: "sub-3",
          name: "Workspace Diff Generator",
          role: "researcher",
          task: "Index git uncommitted files in /workspace",
          status: "idle",
          progress: 20,
          tokens: 610,
        },
      ],
    },
  ]);

  const getRoleBadge = (role: SubagentNode["role"]) => {
    switch (role) {
      case "coordinator":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Orchestrator</Badge>;
      case "coder":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Coder</Badge>;
      case "reviewer":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Reviewer</Badge>;
      case "researcher":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">Researcher</Badge>;
    }
  };

  const getStatusBadge = (status: SubagentNode["status"]) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px] gap-1">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" /> Running
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[10px] gap-1">
            <CheckCircle2 className="size-3" /> Done
          </Badge>
        );
      case "idle":
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
            <Clock className="size-3" /> Queued
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="size-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Bot Mode & Swarm Hierarchy</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle between interactive chat and autonomous swarm execution. Inspect subagents spawned via <code className="font-mono text-primary">delegate_task</code>.
          </p>
        </div>

        {/* Bot Mode Switch */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-primary/30 bg-primary/10">
          <div className="flex flex-col">
            <span className="text-xs font-semibold">
              {isBotMode ? "Autonomous Bot Mode" : "Interactive Chat"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isBotMode ? "Auto-executes subagent plans" : "Human approval step enabled"}
            </span>
          </div>
          <Switch checked={isBotMode} onCheckedChange={setIsBotMode} />
        </div>
      </div>

      {/* Multi-Channel Target Selector */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="size-4 text-primary" />
              <span className="font-semibold text-xs">Multi-Channel Delivery Target</span>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Target: {deliveryTarget.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "webui", label: "Origin WebUI", desc: "Live in-browser streaming" },
            { id: "discord", label: "Discord Bot", desc: "Webhook / Bot bridge" },
            { id: "telegram", label: "Telegram Bot", desc: "Hermes Telegram Daemon" },
            { id: "local", label: "Local Save", desc: "Write outputs to /workspace" },
          ].map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setDeliveryTarget(ch.id as any)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                deliveryTarget === ch.id
                  ? "border-primary bg-primary/15 text-primary shadow-xs"
                  : "border-border/40 bg-muted/20 hover:border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-semibold text-xs">{ch.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{ch.desc}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Live Swarm Tree */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="size-4 text-primary" />
            <span className="font-semibold text-xs">Active Subagent Tree (Parent-Child)</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => {}}
          >
            <RefreshCw className="size-3" /> Refresh Swarm
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {subagents.map((root) => (
            <div key={root.id} className="space-y-3">
              {/* Root Orchestrator Card */}
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="size-4 text-primary animate-pulse" />
                    <span className="font-semibold text-sm">{root.name}</span>
                    {getRoleBadge(root.role)}
                  </div>
                  {getStatusBadge(root.status)}
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-background/60 p-2 rounded-lg border border-border/40">
                  {root.task}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Progress: {root.progress}%</span>
                  <span>Tokens: {root.tokens.toLocaleString()}</span>
                </div>
              </div>

              {/* Children Nodes */}
              {root.children && (
                <div className="pl-6 space-y-2 border-l-2 border-primary/20 ml-4">
                  {root.children.map((child) => (
                    <div
                      key={child.id}
                      className="p-3 rounded-xl border border-border/40 bg-muted/15 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                          <span className="font-medium text-xs">{child.name}</span>
                          {getRoleBadge(child.role)}
                        </div>
                        {getStatusBadge(child.status)}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {child.task}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                        <span>Progress: {child.progress}%</span>
                        <span>Tokens: {child.tokens.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
