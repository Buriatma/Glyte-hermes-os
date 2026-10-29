"use client";

import { useState } from "react";
import { 
  Network, 
  Search, 
  Brain, 
  Tag, 
  Plus, 
  Calendar, 
  Check, 
  Trash2,
  FileText
} from "lucide-react";

interface MemoryNode {
  id: string;
  label: string;
  category: "directive" | "preference" | "architecture" | "skill" | "pitfall";
  content: string;
  connections: string[];
  updatedAt: string;
}

const INITIAL_NODES: MemoryNode[] = [
  {
    id: "node-1",
    label: "Sovereignty & REA Pattern",
    category: "directive",
    content: "GlyteOS Hermes must remain 100% sovereign: zero external database dependencies (PostgreSQL/Redis), zero external OAuth. Local state is stored in SQLite WAL and JSON-RPC 2.0 WebSockets.",
    connections: ["node-2", "node-3"],
    updatedAt: "Oct 29, 2026",
  },
  {
    id: "node-2",
    label: "Embedded SQLite FTS5 Engine",
    category: "architecture",
    content: "Local catalog of 950+ skills & plugins indexed in ~/.hermes/glyte_cache.db with FTS5 virtual tables, providing sub-2ms keyword & prefix query speeds.",
    connections: ["node-1", "node-4"],
    updatedAt: "Oct 29, 2026",
  },
  {
    id: "node-3",
    label: "Dark Glassmorphism Interface",
    category: "preference",
    content: "ChatGPT and Gemini hybrid aesthetic: floating dockable panels, glowing borders, smooth micro-animations, and high contrast typography.",
    connections: ["node-1"],
    updatedAt: "Oct 29, 2026",
  },
  {
    id: "node-4",
    label: "Systematic Debugging Workflow",
    category: "skill",
    content: "Official core skill: 4-phase root cause debugging. Understand failure symptoms, reproduce deterministically, verify hypothesis with minimal repro, and apply surgical patch.",
    connections: ["node-2", "node-5"],
    updatedAt: "Oct 28, 2026",
  },
  {
    id: "node-5",
    label: "WebSocket onerror Event Traps",
    category: "pitfall",
    content: "In browser standard WebSockets, ws.onerror emits a DOM Event object without a .message property. Always wrap into new Error(event.message || 'Connection failed') to avoid [object Event] unhandled rejections.",
    connections: ["node-4"],
    updatedAt: "Oct 29, 2026",
  },
];

const CATEGORY_STYLES = {
  directive: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", badge: "Directive" },
  architecture: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", badge: "Architecture" },
  preference: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", badge: "Preference" },
  skill: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", badge: "Skill" },
  pitfall: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", badge: "Pitfall" },
};

export function MemoryGraphVisualizer({ onClose }: { onClose?: () => void }) {
  const [nodes, setNodes] = useState<MemoryNode[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<MemoryNode>(INITIAL_NODES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryNode["category"]>("architecture");

  const filteredNodes = nodes.filter((n) =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newContent.trim()) return;

    const newNode: MemoryNode = {
      id: `node-${Date.now()}`,
      label: newLabel.trim(),
      category: newCategory,
      content: newContent.trim(),
      connections: [selectedNode.id],
      updatedAt: "Just now",
    };

    setNodes((prev) => [newNode, ...prev]);
    setSelectedNode(newNode);
    setNewLabel("");
    setNewContent("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNode.id === id) {
      setSelectedNode(nodes.find((n) => n.id !== id) || INITIAL_NODES[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Brain className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Memory Graph
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ~/.hermes/memory
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">Associative recall & declarative knowledge</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Add Memory</span>
          </button>

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

      {/* Main Content Split: Left Node Browser, Right Node Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List / Node Browser */}
        <div className="w-64 border-r border-border/50 flex flex-col bg-muted/10">
          <div className="p-2 border-b border-border/40">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search memory graph..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNode.id;
              const style = CATEGORY_STYLES[node.category];

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/20"
                      : "bg-card/50 border-border/40 hover:bg-card hover:border-border/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${style.bg} ${style.color}`}>
                      {style.badge}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {node.connections.length} links
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-foreground line-clamp-1">
                    {node.label}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {node.content}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Inspector & Node Details */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          {isAdding ? (
            <form onSubmit={handleAddMemory} className="space-y-4 max-w-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h3 className="text-xs font-semibold text-foreground">Record New Knowledge Memory</h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title / Node Label</label>
                <input
                  type="text"
                  placeholder="e.g. SQLite WAL journal mode optimization..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground focus:outline-none"
                >
                  <option value="directive">Directive</option>
                  <option value="architecture">Architecture</option>
                  <option value="preference">Preference</option>
                  <option value="skill">Skill</option>
                  <option value="pitfall">Pitfall</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Memory Content / Facts</label>
                <textarea
                  rows={4}
                  placeholder="Describe the knowledge or rule to persist..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
              >
                Persist into ~/.hermes/memory/
              </button>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start justify-between pb-3 border-b border-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${CATEGORY_STYLES[selectedNode.category].bg} ${CATEGORY_STYLES[selectedNode.category].color}`}>
                      {CATEGORY_STYLES[selectedNode.category].badge}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="size-3" /> {selectedNode.updatedAt}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    {selectedNode.label}
                  </h3>
                </div>

                <button
                  onClick={() => handleDelete(selectedNode.id)}
                  className="text-muted-foreground hover:text-rose-400 p-1.5 rounded hover:bg-muted/50 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Memory Fact Body */}
              <div className="p-3.5 rounded-xl bg-card border border-border/50 text-xs text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedNode.content}
              </div>

              {/* Connections / Graph Associations */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Network className="size-3 text-indigo-400" /> Associative Links
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.connections.map((connId) => {
                    const target = nodes.find((n) => n.id === connId);
                    if (!target) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => setSelectedNode(target)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-xs border border-border/50 transition-colors"
                      >
                        <Tag className="size-3 text-primary" />
                        <span className="text-foreground">{target.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Footer Note */}
          <div className="pt-3 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="size-3" /> Synced with ~/.hermes/MEMORY.md
            </span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <Check className="size-3" /> Active in prompt context
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
