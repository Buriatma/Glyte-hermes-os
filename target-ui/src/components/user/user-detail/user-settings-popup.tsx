"use client";

import React, { useState, useEffect, useRef } from "react";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Server,
  ShieldCheck,
  Zap,
  Check,
  RefreshCw,
  Cpu,
  Globe,
  Sliders,
  ExternalLink,
  Terminal,
  Trash2,
  Copy,
  Download,
  Search,
} from "lucide-react";
import { getGatewayClient, HermesLogEntry } from "@/lib/hermes/gateway-client";
import { ResourceManager } from "@/components/hermes/HardwareTelemetryHUD";
import { cn } from "@/lib/utils";

export function UserSettingsPopup({
  userSettingsComponent: _unused,
}: {
  userSettingsComponent?: React.ReactNode;
}) {
  const [openUserSettings, userSettingsTab, appStoreMutate] = appStore(
    useShallow((state) => [state.openUserSettings, state.userSettingsTab, state.mutate]),
  );

  const [activeTab, setActiveTab] = useState<"resources" | "logs" | "gateway" | "security" | "general" | "diagnostics">("resources");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [password, setPassword] = useState("");
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; latency?: number; ok?: boolean; msg?: string }>({ testing: false });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [autoOpenCanvas, setAutoOpenCanvas] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Logs viewer state
  const [logs, setLogs] = useState<HermesLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "rpc" | "tool" | "info" | "warn" | "error">("all");
  const [logSearch, setLogSearch] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openUserSettings) {
      if (userSettingsTab) {
        setActiveTab(userSettingsTab);
      }
      const client = getGatewayClient();
      setGatewayUrl(client.getGatewayUrl());
      setLogs(client.getLogs());

      const unsubLogs = client.onLog((entry) => {
        setLogs((prev) => [...prev, entry]);
      });
      return () => unsubLogs();
    }
  }, [openUserSettings, userSettingsTab]);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, activeTab]);

  const handleTestPing = async () => {
    setPingStatus({ testing: true });
    const start = performance.now();
    try {
      const client = getGatewayClient();
      if (client.getState() !== "open") {
        await client.connect();
      }
      const latency = Math.round(performance.now() - start);
      setPingStatus({
        testing: false,
        ok: true,
        latency,
        msg: `Connected · ${latency}ms latency`,
      });
    } catch (e: any) {
      setPingStatus({
        testing: false,
        ok: false,
        msg: e.message || "Failed to reach gateway",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (gatewayUrl) {
        const client = getGatewayClient();
        client.setGatewayUrl(gatewayUrl);
      }
      if (password) {
        await fetch("/api/hermes/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "HERMES_WEBUI_PASSWORD", value: password }),
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save user settings:", err);
    }
  };

  const handleClearLogs = () => {
    getGatewayClient().clearLogs();
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleExportLogs = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message} ${l.details ? JSON.stringify(l.details) : ""}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glyte-hermes-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter !== "all" && log.level !== logFilter) return false;
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.level.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <Dialog
      open={openUserSettings}
      onOpenChange={(open) => appStoreMutate({ openUserSettings: open })}
    >
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border border-border/70 bg-[#0b0f19] shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-card/40 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Settings className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground text-left">
                GlyteOS Hermes Sovereign Control Center
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground font-mono text-left">
                Resource manager, live telemetry, execution logs & safety policy
              </p>
            </div>
          </div>

          <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
            Sovereign OS
          </Badge>
        </DialogHeader>

        <div className="flex flex-col md:flex-row min-h-[440px]">
          {/* Left Navigation Tabs */}
          <div className="w-full md:w-52 p-3 border-r border-border/40 bg-card/10 space-y-1">
            <button
              onClick={() => setActiveTab("resources")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "resources"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Cpu className="size-3.5 text-primary" />
              Resource Manager
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "logs"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Terminal className="size-3.5 text-amber-400" />
              Gateway & Agent Logs
            </button>

            <button
              onClick={() => setActiveTab("gateway")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "gateway"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Server className="size-3.5 text-cyan-400" />
              Gateway & RPC
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "security"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <ShieldCheck className="size-3.5 text-emerald-400" />
              Security & Auth
            </button>

            <button
              onClick={() => setActiveTab("general")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "general"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Sliders className="size-3.5" />
              Preferences
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "diagnostics"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Globe className="size-3.5" />
              System Doctor
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[500px]">
            {/* Resource Manager Tab */}
            {activeTab === "resources" && (
              <ResourceManager />
            )}

            {/* Gateway & Agent Logs Tab */}
            {activeTab === "logs" && (
              <div className="space-y-3 flex flex-col h-full animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Terminal className="size-3.5 text-amber-400" />
                      Live Gateway & Agent Event Logs
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Real-time JSON-RPC 2.0 frames, websocket status, and tool execution audit.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLogs}
                      className="h-7 px-2 text-[11px] font-mono gap-1"
                    >
                      {copiedLogs ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedLogs ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportLogs}
                      className="h-7 px-2 text-[11px] font-mono gap-1"
                    >
                      <Download className="size-3" />
                      <span>Export</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearLogs}
                      className="h-7 px-2 text-[11px] font-mono text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    {(["all", "rpc", "tool", "info", "warn", "error"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLogFilter(lvl)}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase transition-colors",
                          logFilter === lvl
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-44">
                    <Search className="size-3 text-muted-foreground absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Filter logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 rounded-lg bg-card/60 border border-border/40 text-[11px] font-mono focus:outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>
                </div>

                {/* Console Log Terminal Window */}
                <div
                  ref={logsContainerRef}
                  className="flex-1 min-h-[260px] max-h-[300px] overflow-y-auto rounded-xl border border-border/40 bg-black/60 p-3 font-mono text-xs space-y-1.5 shadow-inner"
                >
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                      No log entries match the selected filter.
                    </div>
                  ) : (
                    filteredLogs.map((log) => {
                      const timeStr = new Date(log.timestamp).toLocaleTimeString();
                      return (
                        <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-white/5 px-1 py-0.5 rounded">
                          <span className="text-zinc-500 text-[10px] select-none shrink-0 pt-0.5">
                            {timeStr}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] px-1 py-0.2 rounded uppercase font-semibold shrink-0 select-none",
                              log.level === "info" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                              log.level === "rpc" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                              log.level === "tool" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                              log.level === "warn" && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                              log.level === "error" && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            )}
                          >
                            {log.level}
                          </span>
                          <span className="text-zinc-300 break-all select-text">
                            {log.message}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Autoscroll Toggle */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
                  <span>Showing {filteredLogs.length} of {logs.length} entries</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded border-border/50 text-primary focus:ring-0"
                    />
                    <span>Auto-scroll to bottom</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "gateway" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Hermes OS Gateway Endpoint</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    WebSocket JSON-RPC 2.0 address of your running Hermes agent daemon.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400">Gateway URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={gatewayUrl}
                      onChange={(e) => setGatewayUrl(e.target.value)}
                      placeholder="ws://127.0.0.1:9119"
                      className="font-mono text-xs bg-background/50 border-border/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pingStatus.testing}
                      onClick={handleTestPing}
                      className="h-9 px-3 text-xs gap-1.5 shrink-0"
                    >
                      <RefreshCw className={cn("size-3.5", pingStatus.testing && "animate-spin text-primary")} />
                      Ping
                    </Button>
                  </div>
                </div>

                {pingStatus.msg && (
                  <div
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-mono border flex items-center gap-2",
                      pingStatus.ok
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    )}
                  >
                    <Zap className="size-3.5" />
                    <span>{pingStatus.msg}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/30 space-y-2">
                  <div className="text-[11px] font-mono text-muted-foreground">Default Ports by Convention:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-card/40 border border-border/30">
                      <span className="text-primary font-bold">9119</span>: Gateway WebSocket
                    </div>
                    <div className="p-2 rounded-lg bg-card/40 border border-border/30">
                      <span className="text-cyan-400 font-bold">8787</span>: Hermes REST daemon
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Client Authentication</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure the access password required to unlock this WebUI.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400">WebUI Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password to update..."
                    className="font-mono text-xs bg-background/50 border-border/50"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Stored safely in <code className="text-primary">~/.hermes/.env</code>.
                  </span>
                </div>

                <div className="pt-3 border-t border-border/30 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground">Human-In-The-Loop Approvals</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Sensitive tool execution requires your in-stream approval with syntax-highlighted diffs.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      Active: Prompt on Dangerous Tools
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Interface Preferences</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Customize the desktop feel and runtime behavior.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/20">
                    <div>
                      <div className="text-xs font-medium text-foreground">Auto-Open Artifact Canvas</div>
                      <div className="text-[10px] text-muted-foreground">
                        Dock live preview on the right when code or diagrams are generated.
                      </div>
                    </div>
                    <Switch
                      checked={autoOpenCanvas}
                      onCheckedChange={setAutoOpenCanvas}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/20">
                    <div>
                      <div className="text-xs font-medium text-foreground">Live Voice Waveform Feedback</div>
                      <div className="text-[10px] text-muted-foreground">
                        Show real-time frequency analyser while microphone is active.
                      </div>
                    </div>
                    <Switch
                      checked={audioFeedback}
                      onCheckedChange={setAudioFeedback}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "diagnostics" && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">System Doctor & Stack Info</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Sovereign architecture verification report.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-xl border border-border/40 bg-card/30 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="text-foreground font-semibold">GlyteOS Hermes 1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Framework:</span>
                      <span className="text-cyan-400">Next.js 16.1.6 (Turbopack)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">External DBs:</span>
                      <span className="text-emerald-400">0 (Zero DB / Sovereign SQLite FTS5)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protocol:</span>
                      <span className="text-foreground">JSON-RPC 2.0 WebSockets</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-primary" />
                      <span className="text-xs font-medium">GlyteTech Portal</span>
                    </div>
                    <a
                      href="https://glyte.tech"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-primary flex items-center gap-1 hover:underline"
                    >
                      glyte.tech <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/40 bg-card/40 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            {savedSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="size-3.5" /> Settings Saved Successfully
              </span>
            ) : (
              "GlyteOS Hermes Sovereign OS"
            )}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => appStoreMutate({ openUserSettings: false })}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
