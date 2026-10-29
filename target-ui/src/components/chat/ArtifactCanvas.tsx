"use client";

import { useState, useEffect } from "react";
import {
  Code,
  Eye,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Download,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ArtifactContent {
  id: string;
  title: string;
  language: string; // "html" | "svg" | "mermaid" | "markdown" | "typescript" | "json"
  code: string;
}

interface ArtifactCanvasProps {
  artifact: ArtifactContent | null;
  onClose: () => void;
  className?: string;
}

export function ArtifactCanvas({ artifact, onClose, className = "" }: ArtifactCanvasProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (artifact?.language === "markdown" || artifact?.language === "html" || artifact?.language === "svg") {
      setActiveTab("preview");
    } else {
      setActiveTab("code");
    }
  }, [artifact?.id]);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.language === "html" ? "html" : artifact.language === "svg" ? "svg" : artifact.language === "markdown" ? "md" : "txt";
    const blob = new Blob([artifact.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col bg-card border-l border-border/60 shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen border-none"
          : "w-[450px] lg:w-[540px] xl:w-[620px] h-full"
      } ${className}`}
    >
      {/* Canvas Top Bar */}
      <div className="h-12 border-b border-border/40 px-3.5 flex items-center justify-between bg-muted/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <Layers className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate max-w-[200px]" title={artifact.title}>
            {artifact.title}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
            {artifact.language}
          </Badge>
        </div>

        {/* Tab & Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-lg bg-muted p-0.5 border border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                activeTab === "preview"
                  ? "bg-background shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                activeTab === "code"
                  ? "bg-background shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="size-3" />
              Code
            </button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Copy code"
          >
            {isCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Download artifact"
          >
            <Download className="size-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="size-7 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="size-7 text-muted-foreground hover:text-destructive"
            title="Close Canvas"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Body */}
      <div className="flex-1 overflow-auto bg-background/50">
        {activeTab === "preview" ? (
          <div className="w-full h-full p-4 overflow-auto">
            {artifact.language === "html" ? (
              <iframe
                title="HTML Preview"
                srcDoc={`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;font-family:sans-serif;background:transparent;color:#f3f4f6;}</style></head><body>${artifact.code}</body></html>`}
                className="w-full h-full min-h-[500px] border border-border/40 rounded-xl bg-slate-950/80 shadow-inner"
                sandbox="allow-scripts"
              />
            ) : artifact.language === "svg" ? (
              <div
                className="w-full h-full flex items-center justify-center p-6 border border-border/40 rounded-xl bg-slate-950/40"
                dangerouslySetInnerHTML={{ __html: artifact.code }}
              />
            ) : (
              <div className="prose prose-invert prose-sm max-w-none p-4 rounded-xl border border-border/40 bg-muted/10 font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {artifact.code}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full p-4">
            <pre className="w-full h-full p-4 rounded-xl border border-border/40 bg-slate-950 text-slate-100 font-mono text-xs overflow-auto leading-relaxed select-all">
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="h-8 border-t border-border/40 px-3 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" />
          <span>GlyteOS Live Artifact Engine</span>
        </div>
        <span>{artifact.code.length} characters</span>
      </div>
    </div>
  );
}
