"use client";

import { useState } from "react";
import { 
  Users, 
  CheckCircle, 
  Cpu, 
  Play
} from "lucide-react";

interface AgentMessage {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  vote?: "agree" | "disagree" | "neutral";
}

const AGENTS = [
  { id: "architect", name: "System Architect", role: "Architecture & Design", avatar: "🏛️", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "developer", name: "Core Developer", role: "Implementation & Diffs", avatar: "💻", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "security", name: "Security Auditor", role: "Vulnerabilities & Secrets", avatar: "🛡️", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "qa", name: "QA Engineer", role: "Test Cases & Validation", avatar: "🧪", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
];

const INITIAL_TRANSCRIPT: AgentMessage[] = [
  {
    id: "msg-1",
    sender: "System Architect",
    role: "Architecture & Design",
    avatar: "🏛️",
    content: "Proposed implementation: Embed SQLite using Node's native DatabaseSync module in WAL mode. This guarantees zero-latency catalog indexing without adding external database containers.",
    timestamp: "10:42 AM",
    vote: "agree",
  },
  {
    id: "msg-2",
    sender: "Security Auditor",
    role: "Vulnerabilities & Secrets",
    avatar: "🛡️",
    content: "Security audit passed. SQLite file permissions are restricted to ~/.hermes/glyte_cache.db (0600) alongside OpenClaw secrets. No remote SQL injection attack surface exists because prepared statements are strictly enforced.",
    timestamp: "10:43 AM",
    vote: "agree",
  },
  {
    id: "msg-3",
    sender: "Core Developer",
    role: "Implementation & Diffs",
    avatar: "💻",
    content: "Implemented FTS5 virtual tables with synchronized database triggers. Benchmark results: Sub-2ms execution time across all 954 official skills & plugins.",
    timestamp: "10:44 AM",
    vote: "agree",
  },
  {
    id: "msg-4",
    sender: "QA Engineer",
    role: "Test Cases & Validation",
    avatar: "🧪",
    content: "Ran tsc --noEmit and live REST endpoints. Exit code 0, all type assertions validated, zero hydration regressions.",
    timestamp: "10:45 AM",
    vote: "agree",
  },
];

export function MultiAgentRooms({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<AgentMessage[]>(INITIAL_TRANSCRIPT);
  const [topic, setTopic] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [consensus, setConsensus] = useState(100);

  const handleStartDebate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isSimulating) return;

    const userTopic = topic.trim();
    setTopic("");
    setIsSimulating(true);
    setConsensus(50);

    // Initial Architect message
    const architectMsg: AgentMessage = {
      id: `m_${Date.now()}_1`,
      sender: "System Architect",
      role: "Architecture & Design",
      avatar: "🏛️",
      content: `Let's analyze the goal: "${userTopic}". Evaluating system trade-offs between sovereign reliability and throughput.`,
      timestamp: "Just now",
      vote: "neutral",
    };

    setMessages((prev) => [...prev, architectMsg]);

    // Developer reply
    setTimeout(() => {
      const devMsg: AgentMessage = {
        id: `m_${Date.now()}_2`,
        sender: "Core Developer",
        role: "Implementation & Diffs",
        avatar: "💻",
        content: `I recommend structuring this with a native Next.js server route and lightweight hook. That keeps state reactive and avoids heavy external dependencies.`,
        timestamp: "Just now",
        vote: "agree",
      };
      setMessages((prev) => [...prev, devMsg]);
      setConsensus(75);
    }, 1200);

    // Security check
    setTimeout(() => {
      const secMsg: AgentMessage = {
        id: `m_${Date.now()}_3`,
        sender: "Security Auditor",
        role: "Vulnerabilities & Secrets",
        avatar: "🛡️",
        content: `Agreed. We must ensure HITL approval triggers on any mutating operations or shell executions.`,
        timestamp: "Just now",
        vote: "agree",
      };
      setMessages((prev) => [...prev, secMsg]);
      setConsensus(100);
      setIsSimulating(false);
    }, 2400);
  };

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Users className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Multi-Agent Room
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                hosted_rooms.py
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">Collaborative multi-persona roundtable</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Consensus Meter */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-card border border-border/50 text-xs">
            <span className="text-muted-foreground text-[10px]">Consensus:</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${consensus}%` }} 
              />
            </div>
            <span className="font-mono text-emerald-400 text-[10px] font-bold">{consensus}%</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded hover:bg-muted/50"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Persona Avatars Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-muted/10 overflow-x-auto">
        {AGENTS.map((agent) => (
          <div 
            key={agent.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${agent.color}`}
          >
            <span>{agent.avatar}</span>
            <span className="font-medium text-foreground">{agent.name}</span>
            <span className="text-[9px] text-muted-foreground">({agent.role.split(" ")[0]})</span>
          </div>
        ))}
      </div>

      {/* Live Debate Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg) => {
          const isAgree = msg.vote === "agree";
          return (
            <div 
              key={msg.id} 
              className="p-3.5 rounded-xl bg-card/80 border border-border/50 space-y-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{msg.avatar}</span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{msg.sender}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                      {msg.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {msg.vote && (
                    <span className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isAgree ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                    }`}>
                      <CheckCircle className="size-2.5" />
                      {msg.vote}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
                </div>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed font-sans pl-6">
                {msg.content}
              </p>
            </div>
          );
        })}

        {isSimulating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-2">
            <Cpu className="size-3.5 animate-spin text-purple-400" />
            <span>Multi-agent consensus deliberating in hosted_rooms...</span>
          </div>
        )}
      </div>

      {/* Input: Trigger Multi-Agent Deliberation */}
      <form onSubmit={handleStartDebate} className="p-3 border-t border-border/50 bg-muted/20 flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Pose a topic for autonomous multi-agent debate (e.g. Architect streaming voice TTS pipeline)..."
          disabled={isSimulating}
          className="flex-1 text-xs px-3 py-2 rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!topic.trim() || isSimulating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors disabled:opacity-50"
        >
          {isSimulating ? <Cpu className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          <span>Debate</span>
        </button>
      </form>
    </div>
  );
}
