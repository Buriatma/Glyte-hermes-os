"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Terminal, 
  FolderKanban, 
  Layers, 
  Sparkles, 
  Cpu, 
  Shield, 
  ArrowRight,
  Database,
  History
} from "lucide-react";

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: string, payload?: any) => void;
}

export function GlobalSpotlightHUD({ isOpen, onClose, onSelectAction }: SpotlightProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ skills: any[]; messages: any[] }>({ skills: [], messages: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults({ skills: [], messages: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search via SQLite FTS5 API
  useEffect(() => {
    if (!query.trim()) {
      setResults({ skills: [], messages: [] });
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/hermes/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            skills: data.skills || [],
            messages: data.messages || [],
          });
        }
      } catch (err) {
        console.error("Spotlight search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const QUICK_ACTIONS = [
    { id: "action:kanban", label: "Open Kanban Task Board", icon: FolderKanban, category: "Navigation", color: "text-amber-400" },
    { id: "action:workspace", label: "Open Workspace Explorer", icon: Layers, category: "Navigation", color: "text-cyan-400" },
    { id: "action:terminal", label: "Open In-Browser Terminal", icon: Terminal, category: "Tool", color: "text-emerald-400" },
    { id: "action:rooms", label: "Open Multi-Agent Rooms", icon: Sparkles, category: "Collaboration", color: "text-purple-400" },
    { id: "action:model", label: "Switch LLM Model (Local / Cloud)", icon: Cpu, category: "Settings", color: "text-blue-400" },
    { id: "action:secrets", label: "Open OpenClaw Secret Vault", icon: Shield, category: "Security", color: "text-rose-400" },
  ];

  const filteredActions = QUICK_ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-card/95 border border-primary/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/50 gap-3 bg-muted/20">
          <Search className="size-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, past chats, or type a command... (e.g. debug, kanban, terminal)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
              ESC
            </span>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          {/* Quick Actions */}
          {(!query || filteredActions.length > 0) && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                System Commands
              </div>
              <div className="space-y-1">
                {(query ? filteredActions : QUICK_ACTIONS).map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        onSelectAction?.(action.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-muted/70 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1 rounded-md bg-muted ${action.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <span className="font-medium text-foreground">{action.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{action.category}</span>
                        <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SQLite FTS5 Skills Results */}
          {results.skills.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Skills & Plugins ({results.skills.length})</span>
                <span className="font-mono text-cyan-400 lowercase flex items-center gap-1">
                  <Database className="size-2.5" /> sqlite-fts5
                </span>
              </div>
              <div className="space-y-1">
                {results.skills.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => {
                      onSelectAction?.("skill:inspect", skill);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-muted/70 transition-colors text-left group"
                  >
                    <div className="space-y-0.5 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{skill.title || skill.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {skill.category}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {skill.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {skill.description}
                      </p>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SQLite FTS5 Messages Results */}
          {results.messages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <History className="size-3" /> Past Chats ({results.messages.length})
              </div>
              <div className="space-y-1">
                {results.messages.map((msg, i) => (
                  <button
                    key={msg.id || i}
                    onClick={() => {
                      onSelectAction?.("session:load", msg.session_id);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs hover:bg-muted/70 transition-colors text-left space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{msg.session_title || "Chat Session"}</span>
                      <span className="font-mono text-[10px]">{msg.role}</span>
                    </div>
                    <div 
                      className="text-[11px] text-muted-foreground/90 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: msg.snippet || msg.content }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query && !isLoading && results.skills.length === 0 && results.messages.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands, skills, or messages found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/50 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="px-1 py-0.5 font-mono rounded bg-muted text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 font-mono rounded bg-muted text-[10px]">↓</kbd></span>
            <span>Select <kbd className="px-1 py-0.5 font-mono rounded bg-muted text-[10px]">↵</kbd></span>
          </div>
          <span className="font-mono text-[10px]">⚡ GlyteOS Hermes FTS5 HUD</span>
        </div>
      </div>
    </div>
  );
}
