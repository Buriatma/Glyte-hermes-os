"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getGatewayClient } from "@/lib/hermes/gateway-client";
import { cn } from "@/lib/utils";

export function UserSettingsPopup({
  userSettingsComponent: _unused,
}: {
  userSettingsComponent?: React.ReactNode;
}) {
  const [openUserSettings, appStoreMutate] = appStore(
    useShallow((state) => [state.openUserSettings, state.mutate]),
  );

  const [activeTab, setActiveTab] = useState<"general" | "gateway" | "security" | "diagnostics">("gateway");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [password, setPassword] = useState("");
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; latency?: number; ok?: boolean; msg?: string }>({ testing: false });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [autoOpenCanvas, setAutoOpenCanvas] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  useEffect(() => {
    if (openUserSettings) {
      const client = getGatewayClient();
      setGatewayUrl(client.getGatewayUrl());
    }
  }, [openUserSettings]);

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

  return (
    <Dialog
      open={openUserSettings}
      onOpenChange={(open) => appStoreMutate({ openUserSettings: open })}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-border/70 bg-[#0b0f19] shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-card/40 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Settings className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground text-left">
                GlyteOS Hermes Settings
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground font-mono text-left">
                Operator profile, gateway endpoints & safety policy
              </p>
            </div>
          </div>

          <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
            Sovereign OS
          </Badge>
        </DialogHeader>

        <div className="flex flex-col md:flex-row min-h-[380px]">
          {/* Left Navigation Tabs */}
          <div className="w-full md:w-48 p-3 border-r border-border/40 bg-card/10 space-y-1">
            <button
              onClick={() => setActiveTab("gateway")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                activeTab === "gateway"
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Server className="size-3.5" />
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
              <ShieldCheck className="size-3.5" />
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
              <Cpu className="size-3.5" />
              System Doctor
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
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
                      <span className="text-emerald-400">0 (Zero DB / Sovereign)</span>
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
              "GlyteOS Hermes by GlyteTech"
            )}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => appStoreMutate({ openUserSettings: false })}
              className="text-xs"
            >
              Cancel
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
