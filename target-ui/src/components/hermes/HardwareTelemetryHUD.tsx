"use client";

import { useState } from "react";
import { 
  Cpu, 
  Zap, 
  ChevronDown, 
  Check, 
  Server
} from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  tier: "local" | "cloud";
  provider: string;
  vram?: string;
  context: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  { id: "hermes-3-8b", name: "Hermes 3 (8B Llama 3.1)", tier: "local", provider: "Local vLLM / Ollama", vram: "5.8 GB", context: "128k" },
  { id: "hermes-3-70b", name: "Hermes 3 (70B Llama 3.1)", tier: "local", provider: "Local GPU Server", vram: "38.2 GB", context: "128k" },
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder (32B)", tier: "local", provider: "Local Ollama", vram: "18.4 GB", context: "32k" },
  { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet (Hybrid)", tier: "cloud", provider: "Anthropic", context: "200k" },
  { id: "gpt-4o", name: "GPT-4o Omnimodal", tier: "cloud", provider: "OpenAI", context: "128k" },
  { id: "deepseek-r1", name: "DeepSeek R1 (Reasoning)", tier: "cloud", provider: "OpenRouter", context: "64k" },
];

export function HardwareTelemetryHUD({
  activeModel = "hermes-3-8b",
  onSelectModel,
}: {
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(activeModel);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const current = AVAILABLE_MODELS.find((m) => m.id === selectedId) || AVAILABLE_MODELS[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectModel?.(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Telemetry Chips */}
      <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/80 border border-border/50 text-[11px] font-mono">
        {/* VRAM Gauge */}
        <div className="flex items-center gap-1 text-muted-foreground pr-1.5 border-r border-border/40">
          <Server className="size-3 text-cyan-400" />
          <span>VRAM:</span>
          <span className="text-foreground font-semibold">12.4 / 24G</span>
        </div>

        {/* Tokens/sec */}
        <div className="flex items-center gap-1 text-muted-foreground pr-1.5 border-r border-border/40">
          <Zap className="size-3 text-amber-400" />
          <span className="text-foreground font-semibold">68.2 t/s</span>
        </div>

        {/* CPU */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Cpu className="size-3 text-emerald-400" />
          <span className="text-foreground font-semibold">18%</span>
        </div>
      </div>

      {/* Model Selector Pill */}
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/60 hover:border-primary/50 text-xs font-medium text-foreground transition-all shadow-sm"
      >
        <span className={`size-2 rounded-full ${current.tier === "local" ? "bg-emerald-400" : "bg-cyan-400"}`} />
        <span className="max-w-[130px] truncate">{current.name}</span>
        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground">
          {current.tier}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-card border border-border/60 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Select Inference Model
            </div>

            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === selectedId;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{model.name}</span>
                      {isSelected && <Check className="size-3 text-primary" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                      <span>{model.provider}</span>
                      <span>•</span>
                      <span>{model.context}</span>
                      {model.vram && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400">{model.vram}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    model.tier === "local" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {model.tier}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
