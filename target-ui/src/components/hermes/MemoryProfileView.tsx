"use client";

import { useEffect, useState } from "react";
import { getGatewayClient } from "@/lib/hermes/gateway-client";
import {
  Brain,
  User,
  Save,
  Check,
  RefreshCw,
  FileText,
  Eye,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MemoryProfileViewProps {
  className?: string;
}

// Recommended soft limits in Hermes OS to avoid context bloat
const MEMORY_LIMIT = 8000;
const USER_LIMIT = 4000;

export function MemoryProfileView({ className }: MemoryProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"memory" | "user">("memory");
  const [memoryText, setMemoryText] = useState("");
  const [userText, setUserText] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadMemory = async () => {
    setLoading(true);
    try {
      const client = getGatewayClient();
      const res = await client.getMemory();
      setMemoryText(res?.memory || "");
      setUserText(res?.user || "");
    } catch (e) {
      console.error("Failed to load memory:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const client = getGatewayClient();
      await client.saveMemory(memoryText, userText);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to save memory/user files:", e);
    } finally {
      setSaving(false);
    }
  };

  const currentText = activeTab === "memory" ? memoryText : userText;
  const currentLimit = activeTab === "memory" ? MEMORY_LIMIT : USER_LIMIT;
  const currentLength = currentText.length;
  const percentUsed = Math.min(100, Math.round((currentLength / currentLimit) * 100));

  const getLimitColor = () => {
    if (percentUsed >= 90) return "text-rose-500 bg-rose-500";
    if (percentUsed >= 70) return "text-amber-500 bg-amber-500";
    return "text-emerald-500 bg-emerald-500";
  };

  return (
    <div className={cn("flex flex-col h-full bg-background/50", className)}>
      {/* Top Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2">
              Memory & Profile Store
              <Badge variant="outline" className="text-[10px] font-mono">
                Hermes OS Core
              </Badge>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Persistent memory and user preferences injected into every session turn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={loadMemory}
            disabled={loading}
            title="Reload from Hermes"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <Edit3 className="size-3.5" /> Edit Raw
              </>
            ) : (
              <>
                <Eye className="size-3.5" /> Markdown Preview
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {savedSuccess ? (
              <>
                <Check className="size-3.5 text-emerald-400" /> Saved!
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                {saving ? "Saving..." : "Save to Hermes"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs and Editors */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "memory" | "user")}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 flex items-center justify-between border-b border-border/40">
          <TabsList className="bg-muted/50 p-1 h-9">
            <TabsTrigger
              value="memory"
              className="text-xs gap-1.5 data-[state=active]:bg-background"
            >
              <FileText className="size-3.5" />
              MEMORY.md (Agent Memory)
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="text-xs gap-1.5 data-[state=active]:bg-background"
            >
              <User className="size-3.5" />
              USER.md (User Profile)
            </TabsTrigger>
          </TabsList>

          {/* Character limit meter */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <span className={cn("font-medium", percentUsed >= 90 && "text-rose-500 font-bold")}>
                {currentLength.toLocaleString()}
              </span>
              <span>/</span>
              <span>{currentLimit.toLocaleString()} chars</span>
              <span>({percentUsed}%)</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", getLimitColor().split(" ")[1])}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </div>

        {/* MEMORY.md Tab */}
        <TabsContent value="memory" className="flex-1 p-4 m-0 overflow-hidden flex flex-col">
          {previewMode ? (
            <div className="flex-1 p-4 rounded-lg border border-border/50 bg-black/40 overflow-y-auto prose dark:prose-invert prose-xs max-w-none">
              <ReactMarkdown>{memoryText || "*No content in MEMORY.md yet.*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              placeholder="# Hermes Agent Lessons & Standing Context&#10;&#10;Add facts, patterns, and notes Hermes should permanently remember across sessions..."
              className="flex-1 w-full p-4 rounded-lg border border-border/50 bg-black/60 font-mono text-xs leading-relaxed text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          )}
        </TabsContent>

        {/* USER.md Tab */}
        <TabsContent value="user" className="flex-1 p-4 m-0 overflow-hidden flex flex-col">
          {previewMode ? (
            <div className="flex-1 p-4 rounded-lg border border-border/50 bg-black/40 overflow-y-auto prose dark:prose-invert prose-xs max-w-none">
              <ReactMarkdown>{userText || "*No content in USER.md yet.*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="# User Profile & Personal Preferences&#10;&#10;Specify your preferred communication style, technologies, time zone, and defaults..."
              className="flex-1 w-full p-4 rounded-lg border border-border/50 bg-black/60 font-mono text-xs leading-relaxed text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
