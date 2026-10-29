"use client";

import { useState } from "react";
import { 
  Kanban, 
  Plus, 
  ChevronRight, 
  Trash2, 
  Cpu, 
  Filter
} from "lucide-react";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  column: "backlog" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignedAgent?: string;
  tokensUsed?: number;
  stepsCompleted?: number;
  totalSteps?: number;
}

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: "task-1",
    title: "Inspect gateway latency & WebSocket handshake",
    description: "Measure RTT between Next.js client and Python daemon on port 9119",
    column: "done",
    priority: "high",
    assignedAgent: "@network-prober",
    tokensUsed: 1240,
    stepsCompleted: 3,
    totalSteps: 3,
  },
  {
    id: "task-2",
    title: "Compile official 950+ skills catalog into SQLite FTS5",
    description: "Load official catalog JSON into high-speed SQLite FTS5 virtual table",
    column: "done",
    priority: "urgent",
    assignedAgent: "@indexer",
    tokensUsed: 2850,
    stepsCompleted: 4,
    totalSteps: 4,
  },
  {
    id: "task-3",
    title: "Run automated security checks on OpenClaw secrets",
    description: "Verify ~/.hermes/.env masking and permission hardening (chmod 600)",
    column: "review",
    priority: "urgent",
    assignedAgent: "@security-auditor",
    tokensUsed: 3100,
    stepsCompleted: 2,
    totalSteps: 3,
  },
  {
    id: "task-4",
    title: "Stream real-time voice audio chunks via Web Audio API",
    description: "Hook streaming_tts_consumer WebSocket packets directly to AudioContext",
    column: "in_progress",
    priority: "high",
    assignedAgent: "@audio-synthesizer",
    tokensUsed: 4200,
    stepsCompleted: 2,
    totalSteps: 5,
  },
  {
    id: "task-5",
    title: "Multi-agent roundtable discussion protocol",
    description: "Implement consensus voting mechanism in hosted_rooms.py",
    column: "backlog",
    priority: "medium",
    assignedAgent: "@room-orchestrator",
    tokensUsed: 0,
    stepsCompleted: 0,
    totalSteps: 4,
  },
];

const COLUMNS: { id: KanbanTask["column"]; label: string; color: string; border: string; bg: string }[] = [
  { id: "backlog", label: "Backlog", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
  { id: "in_progress", label: "In Progress", color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5" },
  { id: "review", label: "HITL Review", color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
  { id: "done", label: "Completed", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
];

export function KanbanBoard({ onClose }: { onClose?: () => void }) {
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<KanbanTask["priority"]>("medium");
  const [newAgent, setNewAgent] = useState("@code-agent");

  const advanceTask = (id: string) => {
    const colOrder: KanbanTask["column"][] = ["backlog", "in_progress", "review", "done"];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const currentIndex = colOrder.indexOf(t.column);
          if (currentIndex < colOrder.length - 1) {
            const nextCol = colOrder[currentIndex + 1];
            return {
              ...t,
              column: nextCol,
              stepsCompleted: Math.min((t.stepsCompleted || 0) + 1, t.totalSteps || 1),
            };
          }
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      column: "backlog",
      priority: newPriority,
      assignedAgent: newAgent,
      tokensUsed: 0,
      stepsCompleted: 0,
      totalSteps: 3,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setIsAddingTask(false);
  };

  const filteredTasks = tasks.filter((t) =>
    filterPriority === "all" ? true : t.priority === filterPriority
  );

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Kanban className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Hermes Kanban
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                session_kanban.py
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">Autonomous subagent execution board</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-background/60 border border-border/50 rounded-md px-2 py-1 text-xs">
            <Filter className="size-3 text-muted-foreground" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>New Task</span>
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

      {/* New Task Dialog / Form Overlay */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 mx-4 my-2 border border-primary/30 rounded-xl bg-card/90 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">Create Autonomous Task</h3>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            placeholder="Task title (e.g. Benchmark SQLite FTS5 query speed)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground focus:outline-none focus:border-primary"
            autoFocus
          />

          <textarea
            placeholder="Detailed instructions or prompt for subagent..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground focus:outline-none focus:border-primary resize-none"
          />

          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>

              <select
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                className="bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground font-mono"
              >
                <option value="@code-agent">@code-agent</option>
                <option value="@security-auditor">@security-auditor</option>
                <option value="@test-runner">@test-runner</option>
                <option value="@researcher">@researcher</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
            >
              Dispatch Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-3 h-full min-w-[750px]">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.column === col.id);

            return (
              <div
                key={col.id}
                className={`flex-1 flex flex-col rounded-xl border ${col.border} ${col.bg} p-2.5 min-w-[180px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-background/80 text-muted-foreground border border-border/40">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-28 text-muted-foreground/60 text-[11px] border border-dashed border-border/30 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group p-3 rounded-lg bg-card/90 border border-border/50 hover:border-primary/40 shadow-sm transition-all hover:shadow-md space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-medium text-foreground leading-snug">
                            {task.title}
                          </h4>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 p-0.5 transition-opacity"
                            title="Delete task"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {task.totalSteps && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Step {task.stepsCompleted} / {task.totalSteps}</span>
                              <span>{Math.round(((task.stepsCompleted || 0) / task.totalSteps) * 100)}%</span>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${((task.stepsCompleted || 0) / task.totalSteps) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            {task.assignedAgent && (
                              <span className="font-mono text-cyan-400/90 bg-cyan-500/10 px-1 py-0.5 rounded">
                                {task.assignedAgent}
                              </span>
                            )}
                            {task.tokensUsed ? (
                              <span className="flex items-center gap-0.5 text-muted-foreground font-mono">
                                <Cpu className="size-2.5" />
                                {task.tokensUsed}t
                              </span>
                            ) : null}
                          </div>

                          {col.id !== "done" && (
                            <button
                              onClick={() => advanceTask(task.id)}
                              className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-1.5 py-0.5 rounded"
                              title="Advance to next stage"
                            >
                              <span>Next</span>
                              <ChevronRight className="size-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
