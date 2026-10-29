"use client";

import React, { useEffect, useState } from "react";
import {
  Folder,
  FileCode,
  FileText,
  File,
  Download,
  GitBranch,
  RefreshCw,
  Search,
  ChevronRight,
  Layers,
  FileCheck2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WorkspaceItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  mtime: string;
  ext: string;
}

interface GitInfo {
  branch: string;
  status: string[];
  diff: string;
}

export function WorkspaceDrawer() {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [root, setRoot] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<WorkspaceItem | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"explorer" | "git">("explorer");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchWorkspace = async (dirPath: string = ".") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspace/raw?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCurrentPath(data.currentPath || dirPath);
        setRoot(data.root || "");
      }
    } catch (err) {
      console.error("Failed to load workspace files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGitInfo = async () => {
    try {
      const res = await fetch(`/api/workspace/raw?git=1`);
      const data = await res.json();
      setGitInfo(data);
    } catch (err) {
      console.error("Failed to load git status:", err);
    }
  };

  useEffect(() => {
    fetchWorkspace(".");
    fetchGitInfo();
  }, []);

  const handleSelectFile = async (item: WorkspaceItem) => {
    if (item.isDir) {
      fetchWorkspace(item.path);
      return;
    }
    setSelectedFile(item);
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/workspace/raw?path=${encodeURIComponent(item.path)}`);
      const text = await res.text();
      setFileContent(text);
    } catch (err) {
      setFileContent("Failed to load file content.");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDownload = (item: WorkspaceItem) => {
    window.open(`/api/workspace/raw?path=${encodeURIComponent(item.path)}&download=1`, "_blank");
  };

  const handleCopyPath = (pathStr: string) => {
    navigator.clipboard.writeText(pathStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (item: WorkspaceItem) => {
    if (item.isDir) return <Folder className="size-4 text-amber-400 shrink-0" />;
    const ext = item.ext.toLowerCase();
    if (["ts", "tsx", "js", "jsx", "py", "rs", "go", "json"].includes(ext)) {
      return <FileCode className="size-4 text-cyan-400 shrink-0" />;
    }
    if (["md", "txt", "log", "yaml", "yml"].includes(ext)) {
      return <FileText className="size-4 text-emerald-400 shrink-0" />;
    }
    return <File className="size-4 text-zinc-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/40 bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Workspace Explorer</h2>
              <Badge variant="outline" className="font-mono text-[10px] text-zinc-400">
                GlyteOS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
              {root || "/workspace"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted/60 p-0.5 border border-border/40">
            <button
              onClick={() => setActiveTab("explorer")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                activeTab === "explorer"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Folder className="size-3.5" />
              Files
            </button>
            <button
              onClick={() => setActiveTab("git")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                activeTab === "git"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitBranch className="size-3.5 text-emerald-400" />
              Git Diff
              {gitInfo?.status && gitInfo.status.length > 0 && (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchWorkspace(currentPath);
              fetchGitInfo();
            }}
            className="h-8 gap-1.5 text-xs border-border/50 bg-card/40 hover:bg-card"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "explorer" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Left Pane */}
          <div className="w-80 sm:w-96 border-r border-border/40 flex flex-col bg-card/10">
            {/* Breadcrumb & Search */}
            <div className="p-3 border-b border-border/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono overflow-x-auto py-1">
                <button
                  onClick={() => fetchWorkspace(".")}
                  className="hover:text-foreground transition-colors"
                >
                  root
                </button>
                {currentPath !== "." &&
                  currentPath.split("/").map((part, idx, arr) => {
                    const subPath = arr.slice(0, idx + 1).join("/");
                    return (
                      <React.Fragment key={idx}>
                        <ChevronRight className="size-3 shrink-0 text-zinc-600" />
                        <button
                          onClick={() => fetchWorkspace(subPath)}
                          className="hover:text-foreground transition-colors truncate max-w-[100px]"
                        >
                          {part}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter workspace files..."
                  className="h-8 pl-8 text-xs bg-background/50 border-border/40 font-mono"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {currentPath !== "." && (
                <button
                  onClick={() => {
                    const parent = currentPath.split("/").slice(0, -1).join("/") || ".";
                    fetchWorkspace(parent);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:bg-muted/40 transition-colors text-left"
                >
                  <Folder className="size-4 text-zinc-500" />
                  .. (Go up)
                </button>
              )}

              {filteredItems.map((item) => {
                const isSelected = selectedFile?.path === item.path;
                return (
                  <div
                    key={item.path}
                    className={cn(
                      "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-zinc-300 hover:bg-muted/40"
                    )}
                    onClick={() => handleSelectFile(item)}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {getFileIcon(item)}
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                      <span className="text-[10px] text-muted-foreground">
                        {item.isDir ? "dir" : formatSize(item.size)}
                      </span>
                      {!item.isDir && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          title="Instant Download"
                          className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No files found matching search.
                </div>
              )}
            </div>
          </div>

          {/* File Preview Right Pane */}
          <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
            {selectedFile ? (
              <>
                <div className="px-4 py-2.5 border-b border-border/40 bg-card/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {getFileIcon(selectedFile)}
                    <span className="text-xs font-mono font-medium text-foreground truncate">
                      {selectedFile.path}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      {formatSize(selectedFile.size)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPath(selectedFile.path)}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copied ? "Copied" : "Copy Path"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedFile)}
                      className="h-7 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Download className="size-3" />
                      Download Raw
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 leading-relaxed bg-[#090d16]">
                  {loadingContent ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                      Loading file preview...
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-all">{fileContent}</pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <FileCode className="size-12 stroke-[1.2] mb-3 text-zinc-600" />
                <h3 className="text-sm font-medium text-foreground">Select a file to inspect</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  View source code, syntax, and raw content or use the 1-click download generator.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Git Status & Diff Tab */
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GitBranch className="size-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground">Active Branch</div>
                <div className="text-sm font-semibold text-foreground font-mono">
                  {gitInfo?.branch || "main"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {gitInfo?.status?.length || 0} Changed Files
              </Badge>
            </div>
          </div>

          {/* Changed Files */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground font-mono uppercase tracking-wider">
              Working Tree Status
            </h3>
            <div className="rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20 overflow-hidden">
              {gitInfo?.status && gitInfo.status.length > 0 ? (
                gitInfo.status.map((line, i) => (
                  <div key={i} className="px-3.5 py-2 flex items-center gap-2 font-mono text-xs">
                    <span className="text-amber-400 font-semibold">{line.slice(0, 2)}</span>
                    <span className="text-zinc-300">{line.slice(2).trim()}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <FileCheck2 className="size-4 text-emerald-400" />
                  Working tree is clean. No uncommitted modifications.
                </div>
              )}
            </div>
          </div>

          {/* Diff Block */}
          {gitInfo?.diff && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground font-mono uppercase tracking-wider">
                Unified Git Diff
              </h3>
              <div className="rounded-xl border border-border/40 bg-[#090d16] p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
                {gitInfo.diff.split("\n").map((line, idx) => {
                  const isAdd = line.startsWith("+") && !line.startsWith("+++");
                  const isDel = line.startsWith("-") && !line.startsWith("---");
                  const isMeta = line.startsWith("@@") || line.startsWith("diff");
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "leading-relaxed whitespace-pre",
                        isAdd && "text-emerald-400 bg-emerald-500/10",
                        isDel && "text-rose-400 bg-rose-500/10",
                        isMeta && "text-cyan-400 font-semibold"
                      )}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
