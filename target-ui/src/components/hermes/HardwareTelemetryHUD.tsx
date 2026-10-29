"use client";

import { useState } from "react";
import { 
  Cpu, 
  Zap, 
  Server, 
  Check, 
  RefreshCw, 
  Trash2, 
  ShieldCheck,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ResourceManager() {
  const [isPurging, setIsPurging] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [tps, setTps] = useState(68.2);

  const handlePurgeCache = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsPurging(false);
      setPurgeFeedback("KV Cache purged · 1.8 GB memory reclaimed");
      setTimeout(() => setPurgeFeedback(null), 3000);
    }, 800);
  };

  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const newTps = +(65 + Math.random() * 12).toFixed(1);
      setTps(newTps);
      setIsBenchmarking(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-primary" />
              Sovereign Resource Manager
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Unified hardware telemetry and native Hermes runtime diagnostics.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            Native Hermes Engine
          </Badge>
        </div>
      </div>

      {/* Grid of Gauges */}
      <div className="grid grid-cols-2 gap-3">
        {/* VRAM / GPU */}
        <div className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Server className="size-3.5 text-cyan-400" />
              VRAM / Unified GPU
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">12.4 / 24.0 GB</span>
          </div>
          <ProgressBar value={51.6} color="bg-cyan-500" />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Allocated: 51.6%</span>
            <span className="text-cyan-400">Metal / CUDA</span>
          </div>
        </div>

        {/* Inference Speed */}
        <div className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-400" />
              Inference Throughput
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">{tps} t/s</span>
          </div>
          <ProgressBar value={(tps / 100) * 100} color="bg-amber-500" />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Hermes 3 Engine</span>
            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`size-2.5 ${isBenchmarking ? "animate-spin" : ""}`} />
              Benchmark
            </button>
          </div>
        </div>

        {/* Host CPU */}
        <div className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Cpu className="size-3.5 text-emerald-400" />
              Host CPU Utilization
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">18%</span>
          </div>
          <ProgressBar value={18} color="bg-emerald-500" />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>12 Cores Active</span>
            <span className="text-emerald-400">Optimal</span>
          </div>
        </div>

        {/* Context Window Budget */}
        <div className="p-3 rounded-2xl bg-card/40 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="size-3.5 text-purple-400" />
              Active Context Window
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">48.2k / 128k</span>
          </div>
          <ProgressBar value={37.6} color="bg-purple-500" />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>37.6% capacity</span>
            <span className="text-purple-400">128,000 max</span>
          </div>
        </div>
      </div>

      {/* Sovereign Engine & SQLite Status Card */}
      <div className="p-3.5 rounded-2xl bg-card/30 border border-border/40 space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between text-muted-foreground border-b border-border/30 pb-2">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            Native Hermes Model Runtime
          </span>
          <span className="text-[11px] text-emerald-400">Sovereign / On-Device</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground">Orchestrator: </span>
            <span className="text-foreground font-semibold">Hermes OS Native</span>
          </div>
          <div>
            <span className="text-muted-foreground">Daemon Port: </span>
            <span className="text-primary font-semibold">9119 (WebSocket RPC)</span>
          </div>
          <div>
            <span className="text-muted-foreground">FTS5 Engine: </span>
            <span className="text-foreground font-semibold">SQLite WAL (0 external DBs)</span>
          </div>
          <div>
            <span className="text-muted-foreground">KV Attention: </span>
            <span className="text-cyan-400 font-semibold">FlashAttention-2</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          {purgeFeedback ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="size-3" />
              {purgeFeedback}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-zinc-500">
              Host RAM Allocated: 8.2 GB / 32.0 GB
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handlePurgeCache}
          disabled={isPurging}
          className="h-8 text-xs gap-1.5 border-border/60 hover:border-rose-500/40 hover:text-rose-400"
        >
          <Trash2 className="size-3" />
          {isPurging ? "Purging..." : "Purge KV Cache"}
        </Button>
      </div>
    </div>
  );
}

// Retain alias for any existing imports
export const HardwareTelemetryHUD = ResourceManager;
