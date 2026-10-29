"use client";

import { useEffect, useState } from "react";
import {
  getGatewayClient,
  HermesSession,
} from "@/lib/hermes/gateway-client";
import {
  GitBranch,
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Clock,
  Sparkles,
  ArrowRight,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SessionsPanelProps {
  currentSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  className?: string;
}

export function SessionsPanel({
  currentSessionId,
  onSelectSession,
  className,
}: SessionsPanelProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<HermesSession[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const client = getGatewayClient();
      const list = await client.listSessions();
      setSessions(list);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async () => {
    try {
      const client = getGatewayClient();
      const res = await client.createSession();
      if (res?.session_id) {
        if (onSelectSession) {
          onSelectSession(res.session_id);
        } else {
          router.push(`/chat/${res.session_id}`);
        }
        await loadSessions();
      }
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const handleSelect = (sid: string) => {
    const client = getGatewayClient();
    client.setActiveSession(sid);
    if (onSelectSession) {
      onSelectSession(sid);
    } else {
      router.push(`/chat/${sid}`);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.title || "").toLowerCase().includes(q) ||
      (s.id || "").toLowerCase().includes(q) ||
      (s.model || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (val: string | number) => {
    if (!val) return "";
    try {
      const date = typeof val === "number" ? new Date(val) : new Date(val);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(val);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background/50", className)}>
      {/* Top Controls */}
      <div className="p-4 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h2 className="font-semibold text-sm tracking-tight text-foreground">
              Hermes Sessions
            </h2>
            <Badge variant="outline" className="text-[11px] font-mono">
              {sessions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={loadSessions}
              disabled={loading}
              title="Refresh sessions"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
            <Button
              size="sm"
              onClick={handleCreateSession}
              className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="size-3.5" />
              New Session
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search session lineage, title, id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/70"
          />
        </div>
      </div>

      {/* Session Lineage List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span>Scanning Hermes session store...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground text-xs p-4 border border-dashed rounded-xl">
            <MessageSquare className="size-6 mb-2 opacity-50" />
            <p className="font-medium text-foreground">No sessions found</p>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Start a new session lineage to begin talking to Hermes OS.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateSession}
              className="mt-3 h-7 text-xs"
            >
              <Plus className="size-3 mr-1" /> Create First Session
            </Button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = currentSessionId === session.id;
            const hasLineage = session.lineage && session.lineage.length > 0;

            return (
              <Card
                key={session.id}
                onClick={() => handleSelect(session.id)}
                className={cn(
                  "cursor-pointer transition-all border rounded-xl hover:border-primary/50 group relative overflow-hidden",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:bg-muted/40"
                )}
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {session.title || "Untitled Session"}
                        </span>
                        {isActive && (
                          <Badge className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
                        {session.id}
                      </p>
                    </div>

                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Lineage indicator */}
                  {hasLineage && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded-md">
                      <GitBranch className="size-3 text-primary shrink-0" />
                      <span className="truncate">
                        Lineage: {session.lineage!.join(" → ")}
                      </span>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDate(session.updatedAt || session.createdAt)}
                    </span>
                    {session.model && (
                      <span className="flex items-center gap-1 font-mono text-zinc-400">
                        <Sparkles className="size-2.5 text-amber-500" />
                        {session.model}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
